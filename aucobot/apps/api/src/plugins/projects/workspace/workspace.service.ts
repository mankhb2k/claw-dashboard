import { Injectable } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import {
  buildInitialOpenClawConfig,
  cleanupStaleMainAgentModels,
  ensureProjectLayout,
  mergeAgentsIntoConfig,
  mergeChannelsIntoConfig,
  mergeConnectorsIntoConfig,
  mergeGatewayBlockIfMissing,
  mergeProviderKeysIntoConfig,
  openClawConfigPath,
  readOpenClawConfigJson,
  removeLegacyDotEnv,
  resolveProjectDataDir,
  type OpenClawProjectConfig,
  parseAgentFormData,
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

  /** Ensure `openclaw.json` exists before the gateway reads the volume. */
  async ensureGatewayConfigOnDisk(projectId: string, gatewayToken: string): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = openClawConfigPath(dataDir);
    const existing = await readOpenClawConfigJson(configPath);
    if (!existing) {
      const config = buildInitialOpenClawConfig({ gatewayToken });
      await this.syncOpenClawJsonToDisk(projectId, config);
      return;
    }
    const gateway = existing.gateway as Record<string, unknown> | undefined;
    const auth = gateway?.auth as Record<string, unknown> | undefined;
    if (!gateway?.mode) {
      const config = buildInitialOpenClawConfig({ gatewayToken });
      await this.syncOpenClawJsonToDisk(projectId, config);
    } else if (auth?.mode === 'token' && typeof auth.token === 'string') {
      /* keep existing token */
    } else {
      const config = buildInitialOpenClawConfig({ gatewayToken });
      await this.syncOpenClawJsonToDisk(projectId, config);
    }
  }

  async syncProjectRuntime(projectId: string): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = openClawConfigPath(dataDir);
    const config = (await readOpenClawConfigJson(configPath)) ?? {};

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { gatewayToken: true },
    });
    mergeGatewayBlockIfMissing(config, resolveOssGatewayToken(project?.gatewayToken));

    const providerRows = await this.prisma.projectProviderKey.findMany({
      where: { projectId },
    });
    mergeProviderKeysIntoConfig(config, providerRows, decryptSecret);

    const agentRows = await this.prisma.projectAgent.findMany({
      where: { projectId, enabled: true },
    });
    mergeAgentsIntoConfig(
      config,
      agentRows.map((row) => ({
        slug: row.slug,
        name: row.name,
        formData: parseAgentFormData(row.formData),
        isDefault: row.isDefault,
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
