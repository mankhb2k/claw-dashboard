import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { SlugService } from '../../core/common/slug/slug.service';
import { ProjectSecretsService } from './project-secrets.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly planGate: PlanGateService,
    private readonly events: EventEmitter2,
    private readonly slug: SlugService,
    private readonly projectSecrets: ProjectSecretsService,
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
    const workerPlan = this.planNameToWorker(plan.name);

    const { project: created, dockerEnv } = await this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          userId,
          displayName,
          subdomain: slug,
          status: 'CREATING',
        },
      });
      await this.projectSecrets.ensureGatewayToken(tx, p.id);
      const envForDocker = await this.projectSecrets.buildDockerEnvMap(tx, p.id);
      return { project: p, dockerEnv: envForDocker };
    });

    await this.queue.enqueueSpawn(
      created.id,
      userId,
      slug,
      image,
      Number(plan.cpuVcpu),
      plan.ramMb,
      plan.idleTimeoutMin,
      workerPlan,
      dockerEnv,
    );

    await this.prisma.containerInstance.create({
      data: {
        projectId: created.id,
        imageVersion: image,
        cpuLimit: plan.cpuVcpu,
        ramLimit: plan.ramMb,
        status: 'STARTING',
        nodeId: created.vpsId,
      },
    });

    this.events.emit(AppEvents.PROJECT_CREATED, {
      projectId: created.id,
      userId,
      subdomain: slug,
      displayName,
      planName: plan.name,
    } satisfies ProjectCreatedEvent);

    return this.withPublicUrl(created);
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

    await this.prisma.heavyJob.deleteMany({ where: { projectId } });

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

  async getGatewayToken(projectId: string, userId: string) {
    await this.findOwned(projectId, userId);
    const token = await this.projectSecrets.getGatewayTokenPlain(projectId);
    return { token };
  }

  async listProjectEnv(projectId: string, userId: string) {
    await this.findOwned(projectId, userId);
    const rows = await this.projectSecrets.listEnvRowsForApi(projectId);
    return rows.map((r) => ({
      key: r.key,
      updatedAt: r.updatedAt.toISOString(),
      masked: r.masked,
    }));
  }

  async upsertProjectEnv(
    projectId: string,
    userId: string,
    env: Array<{ key: string; value: string }>,
  ): Promise<void> {
    await this.findOwned(projectId, userId);
    await this.projectSecrets.upsertEnvEntries(projectId, env);
  }

  async deleteProjectEnv(projectId: string, userId: string, key: string): Promise<void> {
    await this.findOwned(projectId, userId);
    await this.projectSecrets.deleteEnvKey(projectId, key);
  }

  async listConnectors(projectId: string, userId: string) {
    await this.findOwned(projectId, userId);
    const rows = await this.prisma.projectConnector.findMany({
      where: { projectId },
      include: {
        connectorDefinition: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    const out = await Promise.all(
      rows.map(async (row) => {
        const secrets = await this.projectSecrets.listConnectorSecretMeta(row.id);
        return {
          id: row.id,
          projectId: row.projectId,
          connectorDefinitionId: row.connectorDefinitionId,
          connectorSlug: row.connectorDefinition.slug,
          connectorName: row.connectorDefinition.displayName,
          connectorKind: row.connectorDefinition.kind,
          displayName: row.displayName ?? row.connectorDefinition.displayName,
          enabled: row.enabled,
          connectionStatus: row.connectionStatus,
          config: row.config,
          lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
          lastError: row.lastError,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          secrets,
          definition: {
            description: row.connectorDefinition.description,
            status: row.connectorDefinition.status,
            configSchema: row.connectorDefinition.configSchema,
          },
        };
      }),
    );

    return out;
  }

  async createConnector(
    projectId: string,
    userId: string,
    input: {
      connectorSlug: string;
      displayName?: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
    },
  ) {
    await this.findOwned(projectId, userId);
    const slug = input.connectorSlug.trim().toLowerCase();
    const definition = await this.prisma.connectorDefinition.findUnique({
      where: { slug },
    });
    if (!definition) {
      throw new NotFoundException('Connector definition not found');
    }
    if (definition.status !== 'ACTIVE') {
      throw new BadRequestException(`Connector "${slug}" is not active`);
    }
    try {
      const created = await this.prisma.projectConnector.create({
        data: {
          projectId,
          connectorDefinitionId: definition.id,
          displayName: input.displayName?.trim() || null,
          enabled: Boolean(input.enabled),
          ...(input.config !== undefined
            ? { config: input.config as Prisma.InputJsonValue }
            : {}),
          connectionStatus: input.enabled ? 'CONNECTED' : 'DISCONNECTED',
        },
      });
      await this.recordConnectorEvent(created.id, 'CREATED', 'Connector created');
      return created;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException(`Connector "${slug}" already exists for this project`);
      }
      throw e;
    }
  }

  async updateConnector(
    projectId: string,
    connectorId: string,
    userId: string,
    input: { displayName?: string; enabled?: boolean; config?: Record<string, unknown> },
  ) {
    const owned = await this.findOwnedConnector(projectId, userId, connectorId);
    const updated = await this.prisma.projectConnector.update({
      where: { id: connectorId },
      data: {
        ...(input.displayName !== undefined
          ? { displayName: input.displayName.trim() || null }
          : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.enabled !== undefined
          ? { connectionStatus: input.enabled ? 'CONNECTED' : 'DISCONNECTED' }
          : {}),
        ...(input.config !== undefined
          ? { config: input.config as Prisma.InputJsonValue }
          : {}),
      },
    });
    if (input.enabled !== undefined) {
      await this.recordConnectorEvent(
        connectorId,
        input.enabled ? 'ENABLED' : 'DISABLED',
        input.enabled ? 'Connector enabled' : 'Connector disabled',
      );
    } else {
      await this.recordConnectorEvent(connectorId, 'UPDATED', 'Connector config updated');
    }
    return {
      ...updated,
      connectorSlug: owned.connectorDefinition.slug,
      connectorName: owned.connectorDefinition.displayName,
    };
  }

  async upsertConnectorSecret(
    projectId: string,
    connectorId: string,
    userId: string,
    secretKey: string,
    value: string,
  ) {
    await this.findOwnedConnector(projectId, userId, connectorId);
    await this.projectSecrets.upsertConnectorSecret(connectorId, secretKey, value);
    await this.recordConnectorEvent(connectorId, 'SECRET_ROTATED', `Secret ${secretKey} upserted`);
  }

  async deleteConnectorSecret(
    projectId: string,
    connectorId: string,
    userId: string,
    secretKey: string,
  ) {
    await this.findOwnedConnector(projectId, userId, connectorId);
    await this.projectSecrets.deleteConnectorSecret(connectorId, secretKey);
    await this.recordConnectorEvent(connectorId, 'UPDATED', `Secret ${secretKey} deleted`);
  }

  async testConnector(projectId: string, connectorId: string, userId: string) {
    await this.findOwnedConnector(projectId, userId, connectorId);
    const hasApiKey = await this.projectSecrets.hasConnectorSecret(connectorId, 'API_KEY');
    const now = new Date();
    if (!hasApiKey) {
      await this.prisma.projectConnector.update({
        where: { id: connectorId },
        data: {
          connectionStatus: 'ERROR',
          lastError: 'Missing API_KEY secret',
          lastTestedAt: now,
        },
      });
      await this.recordConnectorEvent(
        connectorId,
        'TEST_FAIL',
        'Connector test failed: missing API_KEY secret',
      );
      throw new BadRequestException('API_KEY secret is required before testing connector');
    }
    await this.prisma.projectConnector.update({
      where: { id: connectorId },
      data: {
        connectionStatus: 'CONNECTED',
        enabled: true,
        lastError: null,
        lastTestedAt: now,
      },
    });
    await this.recordConnectorEvent(connectorId, 'TEST_OK', 'Connector test successful');
    return { ok: true, testedAt: now.toISOString() };
  }

  async listConnectorDefinitions() {
    const defs = await this.prisma.connectorDefinition.findMany({
      where: { status: { not: 'DEPRECATED' } },
      orderBy: [{ displayName: 'asc' }],
    });
    return defs.map((d) => ({
      id: d.id,
      slug: d.slug,
      displayName: d.displayName,
      description: d.description,
      kind: d.kind,
      status: d.status,
      configSchema: d.configSchema,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
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

  async getRuntimeEnv(projectId: string) {
    return this.projectSecrets.buildDockerEnvMap(this.prisma, projectId);
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

  private planNameToWorker(planName: string): 'free' | 'pro' {
    return planName.toLowerCase() === 'pro' ? 'pro' : 'free';
  }

  private async findOwned(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException('Not your project');

    return project;
  }

  private async findOwnedConnector(projectId: string, userId: string, connectorId: string) {
    await this.findOwned(projectId, userId);
    const connector = await this.prisma.projectConnector.findUnique({
      where: { id: connectorId },
      include: { connectorDefinition: true },
    });
    if (!connector || connector.projectId !== projectId) {
      throw new NotFoundException('Connector not found');
    }
    return connector;
  }

  private async recordConnectorEvent(
    projectConnectorId: string,
    eventType:
      | 'CREATED'
      | 'UPDATED'
      | 'ENABLED'
      | 'DISABLED'
      | 'TEST_OK'
      | 'TEST_FAIL'
      | 'SECRET_ROTATED',
    message: string,
  ): Promise<void> {
    await this.prisma.projectConnectorEvent.create({
      data: {
        projectConnectorId,
        eventType,
        message,
      },
    });
  }
}
