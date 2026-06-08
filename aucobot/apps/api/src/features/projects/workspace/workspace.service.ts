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
  stripLegacyTeamKeysFromRawFormData,
  writeOpenClawConfigJson,
} from '@aucobot/workspace-sync';
import { PrismaService } from '../../../core/database/prisma.service';
import { decryptSecret } from '@aucobot/control-plane-core';
import { resolveConnector } from '../connectors/connector-registry';
import { resolveChannel } from '../channels/channel-registry';
import { resolveOssGatewayToken } from '../runtime/gateway-endpoint';

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
      },
    });
    syncGatewayAuthToken(config, resolveOssGatewayToken(project?.gatewayToken));

    const providerRows = await this.prisma.projectProviderKey.findMany({
      where: { projectId },
    });
    mergeProviderKeysIntoConfig(config, providerRows, decryptSecret);

    const agentRows = await this.prisma.projectAgent.findMany({
      where: { projectId, enabled: true },
    });
    const allAgentRows = await this.prisma.projectAgent.findMany({
      where: { projectId },
      select: { id: true, slug: true, formData: true },
    });

    for (const row of allAgentRows) {
      const cleaned = stripLegacyTeamKeysFromRawFormData(row.formData);
      if (cleaned) {
        await this.prisma.projectAgent.update({
          where: { id: row.id },
          data: { formData: cleaned as object },
        });
        row.formData = cleaned as object;
      }
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

    const projectSandboxDefault = project?.sandboxDefaultEnabled
      ? ({
          mode: project.sandboxDefaultMode === 'all' ? 'all' : 'non-main',
          scope: 'agent',
          workspaceAccess: 'none',
        } as const)
      : undefined;

    mergeAgentsIntoConfig(
      config,
      agentRows.map((row) => ({
        slug: row.slug,
        name: row.name,
        formData: parseAgentFormData(row.formData),
        isDefault: row.isDefault,
      })),
      collaboration,
      projectSandboxDefault,
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
