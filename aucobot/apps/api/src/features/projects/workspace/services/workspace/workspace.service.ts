import { Injectable } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import {
  buildInitialOpenClawConfig,
  cleanupStaleMainAgentModels,
  ensureProjectLayout,
  mergeAgentsIntoConfig,
  mergeChannelsIntoConfig,
  mergeConnectorsIntoConfig,
  mergeHeartbeatIntoConfig,
  writeHeartbeatFiles,
  syncGatewayAuthToken,
  mergeProviderKeysIntoConfig,
  openClawConfigPath,
  readOpenClawConfigJson,
  removeLegacyDotEnv,
  resolveProjectDataDir,
  type OpenClawProjectConfig,
  legacyTeamFormSlice,
  normalizeCollaborationSettings,
  parseAgentFormData,
  parseCollaborationMemberSlugs,
  resolveProjectCollaborationSettings,
  shouldPersistDerivedCollaboration,
  stripLegacyExecKeysFromRawFormData,
  stripLegacyAgentSandboxKeysFromRawFormData,
  stripLegacyTeamKeysFromRawFormData,
  readLegacySandboxExemptFromRawFormData,
  writeOpenClawConfigJson,
  type ProjectExecPolicy,
} from '@aucobot/workspace-sync';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { decryptSecret, getMcpServiceSecret, signProjectMcpToken } from '@aucobot/control-plane-core';
import { migrateFoundationOpenClawId } from '@aucobot/shared';
import { resolveConnector } from '../../../connectors/lib/connector-registry';
import { resolveChannel } from '../../../channels/lib/channel-registry';
import { resolveOssGatewayToken } from '../../../runtime/gateway-endpoint';
import {
  collectFoundationAllowlist,
  resolveProvider,
} from '../../../ai-providers/lib/provider-registry';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  private layoutOptions() {
    return { dataRoot: process.env.OPENCLAW_DATA_ROOT?.trim() };
  }

  /** Host directory bind-mounted to `/home/node/.openclaw` in the gateway container. */
  resolveProjectDataDir(projectId: string): string {
    return resolveProjectDataDir(projectId, this.layoutOptions());
  }

  async ensureProjectLayout(projectId: string): Promise<string> {
    return ensureProjectLayout(projectId, this.layoutOptions());
  }

  async syncOpenClawJsonToDisk(projectId: string, config: OpenClawProjectConfig): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    await writeFile(openClawConfigPath(dataDir), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }

  /** Bootstrap layout + `openclaw.json` on disk (OSS — path is not stored in DB). */
  async bootstrapProjectWorkspace(params: {
    projectId: string;
    gatewayToken: string;
  }): Promise<{ dataDir: string }> {
    const config = buildInitialOpenClawConfig({ gatewayToken: params.gatewayToken });
    const dataDir = await this.ensureProjectLayout(params.projectId);
    await this.syncOpenClawJsonToDisk(params.projectId, config);
    return { dataDir };
  }

  /** Write `gateway.auth.token` on disk (OSS: must match `OPENCLAW_GATEWAY_TOKEN`). */
  async syncGatewayAuthToDisk(projectId: string, gatewayToken: string): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = openClawConfigPath(dataDir);
    const config = (await readOpenClawConfigJson(configPath)) ?? {};
    syncGatewayAuthToken(config, gatewayToken);
    await writeOpenClawConfigJson(configPath, config);
  }

  /** Ensure `openclaw.json` exists and gateway auth matches the canonical token. */
  async ensureGatewayConfigOnDisk(projectId: string, gatewayToken: string): Promise<void> {
    await this.syncGatewayAuthToDisk(projectId, gatewayToken);
  }

  async syncProjectRuntime(projectId: string): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = openClawConfigPath(dataDir);
    const config = (await readOpenClawConfigJson(configPath)) ?? {};

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        gatewayToken: true,
        collaborationEnabled: true,
        collaborationMemberSlugs: true,
        heartbeatEnabled: true,
        heartbeatEvery: true,
        heartbeatMd: true,
        sandboxDefaultEnabled: true,
        sandboxDefaultMode: true,
        sandboxExemptAgentSlugs: true,
        sandboxAppliedAgentSlugs: true,
        execAskPolicy: true,
        execSafeBins: true,
        execTimeoutSec: true,
      },
    });
    syncGatewayAuthToken(config, resolveOssGatewayToken(project?.gatewayToken));

    const providerRows = await this.prisma.projectProviderKey.findMany({
      where: { projectId },
    });
    for (const row of providerRows) {
      const migrated = migrateFoundationOpenClawId(row.defaultModel);
      if (migrated && migrated !== row.defaultModel) {
        await this.prisma.projectProviderKey.update({
          where: { projectId_providerId: { projectId, providerId: row.providerId } },
          data: { defaultModel: migrated },
        });
        row.defaultModel = migrated;
      }
    }
    const enabledProviderIds = new Set(
      providerRows
        .filter((row) => row.enabled)
        .map((row) => row.providerId.trim())
        .filter(Boolean),
    );
    const enabledAiProviderIds = [...enabledProviderIds].filter((id) => {
      return resolveProvider(id)?.uiGroup === 'ai-provider';
    });
    const proxyModelRows = enabledAiProviderIds.length
      ? await this.prisma.projectProviderModel.findMany({
          where: {
            projectId,
            providerId: { in: enabledAiProviderIds },
          },
        })
      : [];
    mergeProviderKeysIntoConfig(config, providerRows, decryptSecret, {
      foundationAllowlistOpenclawIds: collectFoundationAllowlist(enabledProviderIds),
      proxyModelOpenclawIds: proxyModelRows.map((row) => row.openclawId),
    });

    const agentRows = await this.prisma.projectAgent.findMany({
      where: { projectId, enabled: true },
    });
    const allAgentRows = await this.prisma.projectAgent.findMany({
      where: { projectId },
      select: { id: true, slug: true, formData: true },
    });

    const legacyExemptCandidates = new Set<string>(
      parseCollaborationMemberSlugs(project?.sandboxExemptAgentSlugs),
    );

    for (const row of allAgentRows) {
      let nextForm = row.formData;
      if (readLegacySandboxExemptFromRawFormData(nextForm)) {
        legacyExemptCandidates.add(row.slug.trim().toLowerCase());
      }
      const cleanedTeam = stripLegacyTeamKeysFromRawFormData(nextForm);
      if (cleanedTeam) {
        nextForm = cleanedTeam as typeof nextForm;
      }
      const cleanedExec = stripLegacyExecKeysFromRawFormData(nextForm);
      if (cleanedExec) {
        nextForm = cleanedExec as typeof nextForm;
      }
      const cleanedSandbox = stripLegacyAgentSandboxKeysFromRawFormData(nextForm);
      if (cleanedSandbox) {
        nextForm = cleanedSandbox as typeof nextForm;
      }
      if (nextForm !== row.formData) {
        await this.prisma.projectAgent.update({
          where: { id: row.id },
          data: { formData: nextForm as object },
        });
        row.formData = nextForm as object;
      }
    }

    const normalizedExemptSlugs = [...legacyExemptCandidates].sort();
    const storedExemptSlugs = parseCollaborationMemberSlugs(project?.sandboxExemptAgentSlugs).sort();
    if (
      project &&
      normalizedExemptSlugs.join(',') !== storedExemptSlugs.join(',')
    ) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { sandboxExemptAgentSlugs: normalizedExemptSlugs },
      });
    }

    const storedCollaboration = normalizeCollaborationSettings({
      enabled: project?.collaborationEnabled ?? false,
      memberSlugs: parseCollaborationMemberSlugs(project?.collaborationMemberSlugs),
    });
    const collaboration = resolveProjectCollaborationSettings({
      stored: storedCollaboration,
      legacyAgents: allAgentRows.map((row) => ({
        slug: row.slug,
        formData: legacyTeamFormSlice(row.formData),
      })),
    });

    if (shouldPersistDerivedCollaboration(storedCollaboration, collaboration)) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          collaborationEnabled: collaboration.enabled,
          collaborationMemberSlugs: collaboration.memberSlugs,
        },
      });
    }

    const projectExecPolicy: ProjectExecPolicy = {
      ask:
        project?.execAskPolicy === 'always' ||
        project?.execAskPolicy === 'off' ||
        project?.execAskPolicy === 'on-miss'
          ? project.execAskPolicy
          : 'on-miss',
      safeBins: Array.isArray(project?.execSafeBins)
        ? project.execSafeBins.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
        : [],
      timeoutSec: project?.execTimeoutSec ?? 1800,
    };

    const projectSandboxPolicy = {
      enabled: project?.sandboxDefaultEnabled ?? false,
      mode:
        project?.sandboxDefaultMode === 'selected' ||
        project?.sandboxDefaultMode === 'non-main'
          ? ('selected' as const)
          : ('all' as const),
      exemptSlugs: normalizedExemptSlugs,
      appliedSlugs: parseCollaborationMemberSlugs(project?.sandboxAppliedAgentSlugs),
    };

    const enabledSkillRows = await this.prisma.projectSkill.findMany({
      where: { projectId, enabled: true },
      select: { name: true },
      orderBy: { updatedAt: 'desc' },
    });
    const mainAgentSkillNames = enabledSkillRows.map((row) => row.name);

    mergeAgentsIntoConfig(
      config,
      agentRows.map((row) => ({
        slug: row.slug,
        name: row.name,
        formData: parseAgentFormData(row.formData),
        isDefault: row.isDefault,
      })),
      collaboration,
      projectSandboxPolicy,
      projectExecPolicy,
      mainAgentSkillNames,
    );

    const heartbeatAgentRows = await this.prisma.projectAgent.findMany({
      where: { projectId },
      select: {
        slug: true,
        name: true,
        enabled: true,
        heartbeatMode: true,
        heartbeatEvery: true,
        heartbeatMd: true,
      },
    });
    mergeHeartbeatIntoConfig(
      config,
      {
        heartbeatEnabled: project?.heartbeatEnabled ?? false,
        heartbeatEvery: project?.heartbeatEvery ?? '30m',
        heartbeatMd: project?.heartbeatMd ?? null,
      },
      heartbeatAgentRows.map((row) => ({
        slug: row.slug,
        enabled: row.enabled,
        heartbeatMode: row.heartbeatMode,
        heartbeatEvery: row.heartbeatEvery,
        heartbeatMd: row.heartbeatMd,
      })),
    );
    await writeHeartbeatFiles(
      dataDir,
      {
        heartbeatEnabled: project?.heartbeatEnabled ?? false,
        heartbeatEvery: project?.heartbeatEvery ?? '30m',
        heartbeatMd: project?.heartbeatMd ?? null,
      },
      heartbeatAgentRows.map((row) => ({
        slug: row.slug,
        enabled: row.enabled,
        heartbeatMode: row.heartbeatMode,
        heartbeatEvery: row.heartbeatEvery,
        heartbeatMd: row.heartbeatMd,
      })),
    );

    const connectorRows = await this.prisma.projectConnector.findMany({
      where: { projectId },
      include: { secrets: true },
    });
    const aucomcpBase = process.env.AUCOMCP_BASE_URL?.trim();
    const mcpSecret = getMcpServiceSecret();
    const remoteMcp =
      aucomcpBase && mcpSecret ?
        {
          baseUrl: aucomcpBase,
          signProjectToken: (pid: string, connectorSlug: string) =>
            signProjectMcpToken({ projectId: pid, connectorSlug, secret: mcpSecret }),
        }
      : undefined;

    await mergeConnectorsIntoConfig(
      config,
      connectorRows.map((row) => {
        const def = resolveConnector(row.connectorSlug);
        const secrets: Record<string, string> = {};
        for (const s of row.secrets) {
          try {
            secrets[s.secretKey] = decryptSecret(s.ciphertext);
          } catch {
            // skip
          }
        }
        return {
          connectorSlug: row.connectorSlug,
          enabled: row.enabled,
          connectionStatus: row.connectionStatus,
          mcpServerId: def?.mcpServerId ?? row.connectorSlug,
          secrets,
        };
      }),
      dataDir,
      (slug) => {
        const def = resolveConnector(slug);
        return def ? { slug: def.slug, mcpServerId: def.mcpServerId } : undefined;
      },
      {
        projectId,
        remoteMcp,
      },
    );

    const channelRows = await this.prisma.projectChannel.findMany({
      where: { projectId },
      include: { secrets: true },
    });
    mergeChannelsIntoConfig(
      config,
      channelRows.map((row) => {
        const def = resolveChannel(row.channelId);
        const secrets: Record<string, string> = {};
        for (const s of row.secrets) {
          try {
            secrets[s.secretKey] = decryptSecret(s.ciphertext);
          } catch {
            // skip
          }
        }
        const rowConfig = (row.config ?? {}) as Record<string, unknown>;
        let openClawSlice: Record<string, unknown> | undefined;
        if (
          row.enabled &&
          row.connectionStatus === 'CONNECTED' &&
          def &&
          Object.keys(secrets).length > 0
        ) {
          try {
            openClawSlice = def.buildOpenClawConfig(secrets, rowConfig);
          } catch {
            // skip invalid row
          }
        }
        return {
          channelId: row.channelId,
          enabled: row.enabled,
          connectionStatus: row.connectionStatus,
          openClawSlice,
          pluginId: def?.pluginId,
        };
      }),
    );

    await cleanupStaleMainAgentModels(dataDir, config);
    await writeOpenClawConfigJson(configPath, config);
    await removeLegacyDotEnv(dataDir);
  }
}
