import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../core/database/prisma.service';
import { QueueService } from '../../core/queue/queue.service';
import { PlanGateService } from '../../core/billing/plan-gate.service';
import { ProjectStatus } from '../worker-callbacks/dtos/update-status.dto';
import {
  AppEvents,
  ProjectCreatedEvent,
  ProjectDeletedEvent,
  ProjectStartedEvent,
  ProjectStoppedEvent,
} from '../../core/common/events/app-events';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly planGate: PlanGateService,
    private readonly events: EventEmitter2,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  async findByUser(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(userId: string) {
    const plan = await this.planGate.assertProjectLimit(userId);
    const subdomain = await this.generateUniqueSubdomain();

    const project = await this.prisma.project.create({
      data: {
        userId,
        planId: plan.id,
        subdomain,
        status: 'CREATING',
      },
      include: { plan: true },
    });

    await this.queue.enqueueSpawn(
      project.id,
      userId,
      subdomain,
      'openclaw:latest',
      Number(plan.cpuVcpu),
      plan.ramMb,
    );

    await this.prisma.containerInstance.create({
      data: {
        projectId: project.id,
        imageVersion: 'openclaw:latest',
        cpuLimit: plan.cpuVcpu,
        ramLimit: plan.ramMb,
        status: 'STARTING',
        nodeId: project.vpsId,
      },
    });

    this.events.emit(AppEvents.PROJECT_CREATED, {
      projectId: project.id,
      userId,
      subdomain,
      planName: plan.name,
    } satisfies ProjectCreatedEvent);

    return project;
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async getHealth(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);
    return {
      status: project.status,
      subdomain: project.subdomain,
      lastActiveAt: project.lastActiveAt,
      storageUsedMb: project.storageUsedMb,
    };
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  async start(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);

    if (project.status === 'RUNNING') {
      return { status: 'RUNNING', message: 'Already running' };
    }

    if (project.status === 'STARTING') {
      return { status: 'STARTING', message: 'Already starting' };
    }

    if (!['STOPPED', 'ERROR'].includes(project.status)) {
      throw new BadRequestException(`Cannot start project in status: ${project.status}`);
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'STARTING' },
    });

    await this.prisma.containerInstance.create({
      data: {
        projectId,
        imageVersion: 'openclaw:latest',
        cpuLimit: project.plan.cpuVcpu,
        ramLimit: project.plan.ramMb,
        status: 'STARTING',
        nodeId: project.vpsId,
      },
    });

    await this.queue.enqueueWake(projectId, userId);

    this.events.emit(AppEvents.PROJECT_STARTED, {
      projectId,
      userId,
    } satisfies ProjectStartedEvent);

    return { status: 'STARTING', message: 'Container is starting', estimatedWait: '3-5s' };
  }

  // ── Stop ──────────────────────────────────────────────────────────────────

  async stop(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);

    if (project.status === 'STOPPED') {
      return { status: 'STOPPED', message: 'Already stopped' };
    }

    if (!['RUNNING', 'STARTING', 'ERROR'].includes(project.status)) {
      throw new BadRequestException(`Cannot stop project in status: ${project.status}`);
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'STOPPED' },
    });

    const activeInstance = await this.prisma.containerInstance.findFirst({
      where: { projectId, status: { in: ['RUNNING', 'STARTING'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (activeInstance) {
      await this.prisma.containerInstance.update({
        where: { id: activeInstance.id },
        data: { status: 'STOPPED', stoppedAt: new Date() },
      });
    }

    await this.queue.enqueueStop(projectId, userId);

    this.events.emit(AppEvents.PROJECT_STOPPED, {
      projectId,
      userId,
    } satisfies ProjectStoppedEvent);

    return { status: 'STOPPING', message: 'Container is stopping' };
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);

    if (project.status === 'RUNNING') {
      throw new BadRequestException('Stop the project before deleting');
    }

    await this.prisma.project.delete({ where: { id: projectId } });
    await this.queue.enqueueDestroy(projectId, userId);

    this.events.emit(AppEvents.PROJECT_DELETED, {
      projectId,
      userId,
    } satisfies ProjectDeletedEvent);

    return { deleted: true, projectId };
  }

  // ── Container Instance History ────────────────────────────────────────────

  async getInstances(projectId: string, userId: string) {
    await this.findOwned(projectId, userId);

    return this.prisma.containerInstance.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // ── Internal API ─────────────────────────────────────────────────────────

  async updateProjectStatus(projectId: string, status: ProjectStatus, containerId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: status as any },
      include: { plan: true },
    });

    if (containerId) {
      await this.prisma.containerInstance.update({
        where: { id: containerId },
        data: { status: status as any },
      });
    }

    return updated;
  }

  async updateLastActiveAt(projectId: string, lastActiveAt: Date) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { lastActiveAt },
      include: { plan: true },
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async findOwned(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { plan: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Not your project');

    return project;
  }

  private async generateUniqueSubdomain(): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      const subdomain = nanoid(8).toLowerCase();
      const exists = await this.prisma.project.findUnique({ where: { subdomain } });
      if (!exists) return subdomain;
    }

    throw new BadRequestException('Failed to generate unique subdomain after retries. Try again.');
  }
}
