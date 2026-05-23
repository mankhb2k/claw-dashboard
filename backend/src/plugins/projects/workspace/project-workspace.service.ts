import { Injectable } from '@nestjs/common';
import { WorkspaceRevisionKind } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../../../core/database/prisma.service';
import { decryptSecret } from '../../../core/crypto/secret-crypto';
import { parseAgentFormData } from '../agents/agent-form.types';
import { resolveConnector } from '../connectors/connector-registry';
import { mergeConnectorsIntoConfig } from '../connectors/merge-connectors-into-config';
import { buildInitialOpenClawConfig, type OpenClawProjectConfig } from './openclaw-config';
import {
  mergeAgentsIntoConfig,
  mergeProviderKeysIntoConfig,
  readOpenClawConfigJson,
  removeLegacyDotEnv,
  writeOpenClawConfigJson,
} from './openclaw-config-merge';

@Injectable()
export class ProjectWorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Thư mục host bind-mount vào `/home/node/.openclaw` trong container. */
  resolveProjectDataDir(projectId: string): string {
    const root =
      process.env.OPENCLAW_DATA_ROOT?.trim() ||
      path.join(process.cwd(), 'data', 'projects');
    return path.resolve(root, projectId);
  }

  volumeNameFor(projectId: string): string {
    return `oc-vol-${projectId}`;
  }

  async ensureProjectLayout(projectId: string): Promise<string> {
    const dataDir = this.resolveProjectDataDir(projectId);
    await mkdir(path.join(dataDir, 'workspace'), { recursive: true });
    return dataDir;
  }

  async recordRevision(
    projectId: string,
    kind: WorkspaceRevisionKind,
    payload: unknown,
  ) {
    return this.prisma.workspaceRevision.create({
      data: {
        projectId,
        kind,
        payload: payload as object,
      },
    });
  }

  async syncOpenClawJsonToDisk(projectId: string, config: OpenClawProjectConfig): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = path.join(dataDir, 'openclaw.json');
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }

  /** Revision #1 + file trên disk trước khi spawn container. */
  async bootstrapProjectWorkspace(params: {
    projectId: string;
    gatewayToken: string;
  }): Promise<{ syncPathHint: string; volumeName: string }> {
    const config = buildInitialOpenClawConfig({ gatewayToken: params.gatewayToken });
    const syncPathHint = await this.ensureProjectLayout(params.projectId);
    await this.recordRevision(params.projectId, WorkspaceRevisionKind.OPENCLAW_JSON, config);
    await this.syncOpenClawJsonToDisk(params.projectId, config);
    return {
      syncPathHint,
      volumeName: this.volumeNameFor(params.projectId),
    };
  }

  /**
   * Một pipeline ghi `openclaw.json`: provider keys → agents.list (main implicit + user agents).
   */
  /** Giữ `gateway` khi sync — tránh ghi đè mất token/bind sau doctor hoặc merge lỗi. */
  private async ensureGatewayBlock(
    projectId: string,
    config: Record<string, unknown>,
  ): Promise<void> {
    const existing = config.gateway as Record<string, unknown> | undefined;
    const auth = existing?.auth as Record<string, unknown> | undefined;
    if (typeof auth?.token === 'string' && auth.token.length > 0) {
      return;
    }
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { gatewayToken: true },
    });
    const token = project?.gatewayToken?.trim();
    if (!token) {
      return;
    }
    const fresh = buildInitialOpenClawConfig({ gatewayToken: token });
    config.gateway = fresh.gateway;
  }

  async syncProjectRuntime(projectId: string): Promise<void> {
    const dataDir = await this.ensureProjectLayout(projectId);
    const configPath = path.join(dataDir, 'openclaw.json');
    const config = (await readOpenClawConfigJson(configPath)) ?? {};

    await this.ensureGatewayBlock(projectId, config);

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
      resolveConnector,
    );

    await writeOpenClawConfigJson(configPath, config);
    await removeLegacyDotEnv(dataDir);
    await this.recordRevision(projectId, WorkspaceRevisionKind.OPENCLAW_JSON, config);
  }
}
