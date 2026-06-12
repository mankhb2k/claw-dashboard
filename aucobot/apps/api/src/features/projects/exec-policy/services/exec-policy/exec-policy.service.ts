import { Injectable, NotFoundException } from '@nestjs/common';
import {
  openClawConfigPath,
  parseAgentFormData,
  readOpenClawConfigJson,
  type ProjectExecPolicy,
} from '@aucobot/workspace-sync';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import type { UpdateProjectExecPolicyDto } from '../../dto/exec-policy.dto';

const DEFAULT_EXEC_POLICY: ProjectExecPolicy = {
  ask: 'on-miss',
  safeBins: [],
  timeoutSec: 1800,
};

function normalizeSafeBins(values: string[]): string[] {
  return Array.from(
    new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

function execFromOpenClawConfig(config: Record<string, unknown>): ProjectExecPolicy | null {
  const exec = (config.tools as Record<string, unknown> | undefined)?.exec as
    | Record<string, unknown>
    | undefined;
  if (!exec || typeof exec.ask !== 'string') {
    return null;
  }
  const ask = exec.ask.trim();
  if (ask !== 'always' && ask !== 'on-miss' && ask !== 'off') {
    return null;
  }
  const safeBins = Array.isArray(exec.safeBins)
    ? normalizeSafeBins(exec.safeBins.map((v) => String(v)))
    : [];
  const timeoutSec =
    typeof exec.timeoutSec === 'number' && Number.isFinite(exec.timeoutSec)
      ? Math.max(5, Math.min(86400, Math.round(exec.timeoutSec)))
      : DEFAULT_EXEC_POLICY.timeoutSec;
  return { ask, safeBins, timeoutSec };
}

@Injectable()
export class ExecPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  private toResponse(project: {
    execAskPolicy: string;
    execSafeBins: unknown;
    execTimeoutSec: number;
  }) {
    const safeBins = Array.isArray(project.execSafeBins)
      ? normalizeSafeBins(project.execSafeBins.map((v) => String(v)))
      : [];
    const ask = project.execAskPolicy;
    const askPolicy =
      ask === 'always' || ask === 'on-miss' || ask === 'off' ? ask : 'on-miss';
    return {
      askPolicy,
      safeBins,
      timeoutSec: project.execTimeoutSec,
    };
  }

  async getProjectExecPolicy(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        execAskPolicy: true,
        execSafeBins: true,
        execTimeoutSec: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.toResponse(project);
  }

  /** Import tools.exec from disk or default agent when DB still has factory defaults. */
  async maybeMigrateExecPolicyFromLegacy(projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        execAskPolicy: true,
        execSafeBins: true,
        execTimeoutSec: true,
      },
    });
    if (!project) {
      return;
    }

    const safeBins = Array.isArray(project.execSafeBins) ? project.execSafeBins : [];
    const isFactoryDefault =
      project.execAskPolicy === 'on-miss' &&
      project.execTimeoutSec === 1800 &&
      safeBins.length === 0;
    if (!isFactoryDefault) {
      return;
    }

    const dataDir = this.workspace.resolveProjectDataDir(projectId);
    const config = (await readOpenClawConfigJson(openClawConfigPath(dataDir))) ?? {};
    const fromDisk = execFromOpenClawConfig(config);
    if (fromDisk) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          execAskPolicy: fromDisk.ask,
          execSafeBins: fromDisk.safeBins,
          execTimeoutSec: fromDisk.timeoutSec,
        },
      });
      return;
    }

    const defaultAgent = await this.prisma.projectAgent.findFirst({
      where: { projectId, isDefault: true },
      select: { formData: true },
    });
    if (!defaultAgent?.formData) {
      return;
    }
    try {
      const form = parseAgentFormData(defaultAgent.formData);
      const raw = defaultAgent.formData as Record<string, unknown>;
      const legacyAsk = ['always', 'on-miss', 'off'].includes(String(raw.askPolicy))
        ? String(raw.askPolicy)
        : 'on-miss';
      const legacyBins = Array.isArray(raw.safeBins)
        ? normalizeSafeBins(raw.safeBins.map((v) => String(v)))
        : [];
      const legacyTimeout =
        typeof raw.timeoutSec === 'number' && Number.isFinite(raw.timeoutSec)
          ? Math.max(5, Math.min(86400, Math.round(raw.timeoutSec)))
          : DEFAULT_EXEC_POLICY.timeoutSec;
      if (
        legacyAsk !== 'on-miss' ||
        legacyBins.length > 0 ||
        legacyTimeout !== 1800
      ) {
        await this.prisma.project.update({
          where: { id: projectId },
          data: {
            execAskPolicy: legacyAsk,
            execSafeBins: legacyBins,
            execTimeoutSec: legacyTimeout,
          },
        });
      }
    } catch {
      /* ignore invalid legacy form */
    }
  }

  resolveProjectExecPolicy(project: {
    execAskPolicy: string;
    execSafeBins: unknown;
    execTimeoutSec: number;
  }): ProjectExecPolicy {
    const safeBins = Array.isArray(project.execSafeBins)
      ? normalizeSafeBins(project.execSafeBins.map((v) => String(v)))
      : [];
    const ask = project.execAskPolicy;
    return {
      ask: ask === 'always' || ask === 'on-miss' || ask === 'off' ? ask : 'on-miss',
      safeBins,
      timeoutSec: project.execTimeoutSec,
    };
  }

  async updateProjectExecPolicy(projectId: string, dto: UpdateProjectExecPolicyDto) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        execAskPolicy: dto.askPolicy,
        execSafeBins: normalizeSafeBins(dto.safeBins),
        execTimeoutSec: dto.timeoutSec,
      },
    });
    await this.workspace.syncProjectRuntime(projectId);
    return this.getProjectExecPolicy(projectId);
  }
}
