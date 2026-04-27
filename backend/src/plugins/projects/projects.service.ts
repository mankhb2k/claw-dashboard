import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { SlugService } from '../../core/slug/slug.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly planGate: PlanGateService,
    private readonly events: EventEmitter2,
    private readonly slug: SlugService,
  ) {}

  // ── List ─────────────────────────────────────────────────────────────────

  async findByUser(userId: string) {
    const list = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => this.withPublicUrl(p));
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(userId: string, displayName: string) {
    const plan = await this.planGate.assertProjectLimit(userId);
    await this.planGate.assertConcurrentRunningLimit(userId);
    const slug = await this.slug.ensureUniqueSubdomainFromDisplayName(displayName);
    const image = this.getOpenClawImage();

    const project = await this.prisma.project.create({
      data: {
        userId,
        displayName,
        subdomain: slug,
        status: 'CREATING',
      },
    });

    await this.queue.enqueueSpawn(
      project.id,
      userId,
      slug,
      image,
      Number(plan.cpuVcpu),
      plan.ramMb,
      plan.idleTimeoutMin,
    );

    await this.prisma.containerInstance.create({
      data: {
        projectId: project.id,
        imageVersion: image,
        cpuLimit: plan.cpuVcpu,
        ramLimit: plan.ramMb,
        status: 'STARTING',
        nodeId: project.vpsId,
      },
    });

    this.events.emit(AppEvents.PROJECT_CREATED, {
      projectId: project.id,
      userId,
      subdomain: slug,
      displayName,
      planName: plan.name,
    } satisfies ProjectCreatedEvent);

    return this.withPublicUrl(project);
  }

  // ── Update (displayName only) ─────────────────────────────────────────────

  async updateDisplayName(projectId: string, userId: string, displayName: string) {
    const project = await this.findOwned(projectId, userId);
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { displayName },
    });
    return this.withPublicUrl(updated);
  }

  // ── Health ─────────────────────────────────────────────────────────────

  async getHealth(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);
    return {
      status: project.status,
      displayName: project.displayName,
      subdomain: project.subdomain,
      publicUrl: this.buildPublicUrl(project.subdomain),
      lastActiveAt: project.lastActiveAt,
      storageUsedMb: project.storageUsedMb,
    };
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  async start(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);
    const plan = await this.planGate.assertConcurrentRunningLimit(userId);

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

    const image = this.getOpenClawImage();

    await this.prisma.containerInstance.create({
      data: {
        projectId,
        imageVersion: image,
        cpuLimit: plan.cpuVcpu,
        ramLimit: plan.ramMb,
        status: 'STARTING',
        nodeId: project.vpsId,
      },
    });

    await this.queue.enqueueWake(projectId, userId, project.subdomain);

    this.events.emit(AppEvents.PROJECT_STARTED, {
      projectId,
      userId,
    } satisfies ProjectStartedEvent);

    return { status: 'STARTING', message: 'Container is starting', estimatedWait: '30-120s' };
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

    await this.queue.enqueueStop(projectId, userId, project.subdomain);

    this.events.emit(AppEvents.PROJECT_STOPPED, {
      projectId,
      userId,
    } satisfies ProjectStoppedEvent);

    return { status: 'STOPPING', message: 'Container is stopping' };
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);

    if (project.status === 'RUNNING' || project.status === 'STARTING') {
      throw new BadRequestException('Stop the project before deleting');
    }

    const { subdomain } = project;

    await this.queue.enqueueDestroy(projectId, userId, subdomain);
    await this.prisma.project.delete({ where: { id: projectId } });

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

  async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
    containerId?: string,
    errorMessage?: string,
  ) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const prismaStatus = this.toPrismaProjectStatus(status);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          status: prismaStatus,
          errorMessage: status === 'ERROR' ? (errorMessage ?? 'Unknown error') : null,
          ...(status === 'RUNNING' && containerId
            ? { containerName: `openclaw-${project.subdomain}` }
            : {}),
        },
      });

      const instance = await tx.containerInstance.findFirst({
        where: {
          projectId,
          status: { in: ['STARTING', 'RUNNING', 'STOPPING'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (instance) {
        if (status === 'RUNNING') {
          await tx.containerInstance.update({
            where: { id: instance.id },
            data: {
              status: 'RUNNING',
              ...(containerId
                ? { containerId, startedAt: instance.startedAt ?? new Date() }
                : {}),
            },
          });
        } else if (status === 'STOPPED' || status === 'STOPPING') {
          await tx.containerInstance.update({
            where: { id: instance.id },
            data: { status: 'STOPPED', stoppedAt: new Date() },
          });
        } else if (status === 'ERROR') {
          await tx.containerInstance.update({
            where: { id: instance.id },
            data: {
              status: 'ERROR',
              ...(errorMessage ? { errorMessage } : {}),
            },
          });
        } else if (status === 'STARTING' || status === 'CREATING') {
          await tx.containerInstance.update({
            where: { id: instance.id },
            data: { status: 'STARTING' },
          });
        }
      }

      return updated;
    });
  }

  async updateLastActiveAt(projectId: string, lastActiveAt: Date) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id: projectId },
      data: { lastActiveAt },
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private toPrismaProjectStatus(
    s: ProjectStatus,
  ): 'CREATING' | 'RUNNING' | 'STOPPED' | 'STARTING' | 'ERROR' {
    if (s === 'DESTROYING' || s === 'STOPPING') {
      return 'STOPPED';
    }
    return s;
  }

  private getAppDomainLabel(): string {
    const raw = process.env.APP_DOMAIN || 'clawsandbox.cloud';
    return raw
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .replace(/:\d+$/, '')
      .trim() || 'clawsandbox.cloud';
  }

  private buildPublicUrl(subdomain: string): string {
    return `https://${subdomain}.${this.getAppDomainLabel()}`;
  }

  private withPublicUrl<T extends { subdomain: string; publicUrl?: string }>(
    project: T,
  ): T & { publicUrl: string } {
    if ('publicUrl' in project && project.publicUrl) {
      return project as T & { publicUrl: string };
    }
    return { ...project, publicUrl: this.buildPublicUrl(project.subdomain) };
  }

  private getOpenClawImage(): string {
    const v = process.env.OPENCLAW_IMAGE?.trim();
    if (!v) {
      throw new InternalServerErrorException('OPENCLAW_IMAGE is not configured');
    }
    return v;
  }

  private async findOwned(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Not your project');

    return project;
  }
}
