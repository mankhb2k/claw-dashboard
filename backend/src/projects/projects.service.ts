import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ProjectStatus } from '../internal/dtos/update-status.dto';

const FREE_PLAN_NAME = 'free';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
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
    const plan = await this.getPlanForUser(userId);

    const existing = await this.prisma.project.count({ where: { userId } });
    if (existing >= plan.maxProjects) {
      throw new ConflictException(
        `Free plan allows ${plan.maxProjects} project. Upgrade to Pro for more.`,
      );
    }

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

    // Enqueue spawn job to create container
    await this.queue.enqueueSpawn(
      project.id,
      userId,
      subdomain,
      'openclaw:latest',
      Number(plan.cpuVcpu),
      plan.ramMb,
    );

    // Create initial ContainerInstance record
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

    // Update project status to STARTING
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'STARTING' },
    });

    // Create new ContainerInstance for this startup
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

    // Enqueue wake job with highest priority
    await this.queue.enqueueWake(projectId, userId);

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

    // Update project status to STOPPED (mock worker will confirm)
    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'STOPPED' },
    });

    // Update active container instance
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

    // Enqueue stop job with low priority
    await this.queue.enqueueStop(projectId, userId);

    return { status: 'STOPPING', message: 'Container is stopping' };
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);

    if (project.status === 'RUNNING') {
      throw new BadRequestException('Stop the project before deleting');
    }

    // Delete from database (cascade deletes ContainerInstance records)
    await this.prisma.project.delete({ where: { id: projectId } });

    // Enqueue destroy job to clean up Docker volume on VPS
    await this.queue.enqueueDestroy(projectId, userId);

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

  private async getPlanForUser(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (subscription?.plan) return subscription.plan;
    return this.getFreePlan();
  }

  private async getFreePlan() {
    const plan = await this.prisma.plan.findUnique({ where: { name: FREE_PLAN_NAME } });
    if (!plan) throw new BadRequestException('Free plan not configured. Run db seed first.');
    return plan;
  }

  private async generateUniqueSubdomain(): Promise<string> {
    const maxRetries = 5;

    for (let i = 0; i < maxRetries; i++) {
      // nanoid(8) generates lowercase alphanumeric string (a-z0-9)
      const subdomain = nanoid(8).toLowerCase();

      const exists = await this.prisma.project.findUnique({ where: { subdomain } });
      if (!exists) return subdomain;
    }

    throw new BadRequestException('Failed to generate unique subdomain after retries. Try again.');
  }
}
