import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service.js';

const FREE_PLAN_NAME = 'free';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const plan = await this.getFreePlan();

    const existing = await this.prisma.project.count({ where: { userId } });
    if (existing >= plan.maxProjects) {
      throw new ConflictException(
        `Free plan allows ${plan.maxProjects} project. Upgrade to Pro for more.`,
      );
    }

    const subdomain = await this.generateUniqueSubdomain();

    return this.prisma.project.create({
      data: {
        userId,
        planId: plan.id,
        subdomain,
        status: 'CREATING',
      },
      include: { plan: true },
    });
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

    // TODO: enqueue BullMQ job "wake" khi có Redis

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

    // TODO: enqueue BullMQ job "stop" khi có Redis

    return { status: 'STOPPED', message: 'Container stopped' };
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(projectId: string, userId: string) {
    const project = await this.findOwned(projectId, userId);

    if (project.status === 'RUNNING') {
      throw new BadRequestException('Stop the project before deleting');
    }

    await this.prisma.project.delete({ where: { id: projectId } });

    // TODO: enqueue BullMQ job "destroy" để dọn volume trên VPS

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

  private async getFreePlan() {
    const plan = await this.prisma.plan.findUnique({ where: { name: FREE_PLAN_NAME } });
    if (!plan) throw new BadRequestException('Free plan not configured. Run db seed first.');
    return plan;
  }

  private async generateUniqueSubdomain(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const subdomain = nanoid(8).toLowerCase().replace(/[^a-z0-9]/g, 'x');
      const exists = await this.prisma.project.findUnique({ where: { subdomain } });
      if (!exists) return subdomain;
    }
    throw new BadRequestException('Failed to generate unique subdomain. Try again.');
  }
}
