import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { toPrismaInputJson } from '../../../../../core/common/utils/prisma-json.util';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import {
  listActiveConnectors,
  resolveConnector,
} from '../../lib/connector-registry';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '@aucobot/control-plane-core';
import { ConnectorConnectionStatus, Prisma } from '@aucobot/database';

import type { ProjectConnectorDto } from '../../lib/connectors.types';

export type { ProjectConnectorDto } from '../../lib/connectors.types';

type ConnectorRowWithSecrets = Prisma.ProjectConnectorGetPayload<{
  include: { secrets: true };
}>;

@Injectable()
export class ProjectConnectorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
    private readonly jwt: JwtService,
  ) {}

  listDefinitions() {
    const now = new Date().toISOString();
    return listActiveConnectors().map((def) => ({
      id: def.id,
      slug: def.slug,
      displayName: def.displayName,
      description: def.description,
      kind: def.kind,
      status: def.status,
      configSchema: null,
      createdAt: now,
      updatedAt: now,
    }));
  }

  async list(projectId: string): Promise<ProjectConnectorDto[]> {
    const rows = await this.prisma.projectConnector.findMany({
      where: { projectId },
      include: { secrets: true },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  async create(
    projectId: string,
    input: {
      connectorSlug: string;
      displayName?: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
    },
  ): Promise<ProjectConnectorDto> {
    const adapter = resolveConnector(input.connectorSlug);
    if (!adapter) {
      throw new BadRequestException(
        `Unknown connector: ${input.connectorSlug}`,
      );
    }

    const existing = await this.prisma.projectConnector.findUnique({
      where: {
        projectId_connectorSlug: { projectId, connectorSlug: adapter.slug },
      },
    });
    if (existing) {
      throw new ConflictException('Connector already exists for this project');
    }

    const enabled = Boolean(input.enabled);
    const row = await this.prisma.projectConnector.create({
      data: {
        projectId,
        connectorSlug: adapter.slug,
        displayName: input.displayName?.trim() || adapter.displayName,
        enabled,
        connectionStatus: enabled
          ? ConnectorConnectionStatus.CONNECTED
          : ConnectorConnectionStatus.DISCONNECTED,
        config: toPrismaInputJson(input.config ?? {}),
      },
      include: { secrets: true },
    });

    if (enabled) {
      await this.syncOpenClawConfig(projectId);
    }

    return this.toDto(row);
  }

  async update(
    projectId: string,
    connectorId: string,
    input: {
      displayName?: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
    },
  ): Promise<ProjectConnectorDto> {
    const row = await this.requireConnector(projectId, connectorId);
    const data: {
      displayName?: string;
      enabled?: boolean;
      config?: Prisma.InputJsonValue;
      connectionStatus?: ConnectorConnectionStatus;
    } = {};

    if (input.displayName !== undefined) {
      data.displayName = input.displayName.trim() || row.displayName;
    }
    if (input.config !== undefined) {
      data.config = toPrismaInputJson(input.config);
    }
    if (input.enabled !== undefined) {
      data.enabled = input.enabled;
      if (!input.enabled) {
        data.connectionStatus = ConnectorConnectionStatus.DISCONNECTED;
      } else if (row.connectionStatus !== ConnectorConnectionStatus.CONNECTED) {
        throw new BadRequestException(
          'Connector chưa được xác thực OAuth — hãy kết nối trước',
        );
      }
    }

    const updated = await this.prisma.projectConnector.update({
      where: { id: row.id },
      data,
      include: { secrets: true },
    });

    await this.syncOpenClawConfig(projectId);
    return this.toDto(updated);
  }

  async delete(projectId: string, connectorId: string): Promise<void> {
    const row = await this.requireConnector(projectId, connectorId);
    await this.prisma.projectConnector.delete({ where: { id: row.id } });
    await this.syncOpenClawConfig(projectId);
  }

  async upsertSecret(
    projectId: string,
    connectorId: string,
    secretKey: string,
    value: string,
  ): Promise<void> {
    const row = await this.requireConnector(projectId, connectorId);
    const key = secretKey.trim();
    if (!key) throw new BadRequestException('secretKey required');

    await this.prisma.projectConnectorSecret.upsert({
      where: {
        projectConnectorId_secretKey: {
          projectConnectorId: row.id,
          secretKey: key,
        },
      },
      create: {
        projectConnectorId: row.id,
        secretKey: key,
        ciphertext: encryptSecret(value),
      },
      update: { ciphertext: encryptSecret(value) },
    });
  }

  async deleteSecret(
    projectId: string,
    connectorId: string,
    secretKey: string,
  ): Promise<void> {
    const row = await this.requireConnector(projectId, connectorId);
    const key = secretKey.trim();
    if (!key) throw new BadRequestException('secretKey required');
    await this.prisma.projectConnectorSecret.deleteMany({
      where: { projectConnectorId: row.id, secretKey: key },
    });
    await this.syncOpenClawConfig(projectId);
  }

  async test(
    projectId: string,
    connectorId: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const row = await this.requireConnector(projectId, connectorId);
    const adapter = resolveConnector(row.connectorSlug);
    if (!adapter) {
      throw new BadRequestException(`Unknown connector: ${row.connectorSlug}`);
    }

    const secrets = this.decryptSecrets(row.secrets);
    if (!secrets.refresh_token) {
      await this.markTestResult(
        row.id,
        false,
        'Chưa có refresh token — kết nối OAuth trước',
      );
      return { ok: false, message: 'Chưa có refresh token' };
    }

    const result = await adapter.testConnection(secrets);
    await this.markTestResult(
      row.id,
      result.ok,
      result.ok ? null : (result.message ?? 'Test failed'),
    );
    if (result.ok) {
      await this.syncOpenClawConfig(projectId);
    }
    return result;
  }

  async startOAuth(
    userId: string,
    projectId: string,
    connectorSlug: string,
  ): Promise<{ url: string }> {
    const adapter = resolveConnector(connectorSlug);
    if (!adapter?.oauthScopes?.length) {
      throw new BadRequestException('Connector does not support OAuth');
    }
    if (!adapter.isOAuthConfigured()) {
      throw new BadRequestException(
        'Cấu hình GOOGLE_OAUTH_CLIENT_ID và GOOGLE_OAUTH_CLIENT_SECRET trên backend',
      );
    }

    let row = await this.prisma.projectConnector.findUnique({
      where: {
        projectId_connectorSlug: { projectId, connectorSlug: adapter.slug },
      },
    });
    if (!row) {
      row = await this.prisma.projectConnector.create({
        data: {
          projectId,
          connectorSlug: adapter.slug,
          displayName: adapter.displayName,
          enabled: false,
          connectionStatus: ConnectorConnectionStatus.DISCONNECTED,
        },
      });
    }

    const state = await this.jwt.signAsync(
      {
        purpose: 'connector_oauth',
        sub: userId,
        projectId,
        connectorSlug: adapter.slug,
      },
      { expiresIn: '15m' },
    );

    const url = adapter.buildOAuthUrl({ state, prompt: 'consent' });
    return { url };
  }

  async handleOAuthCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string }> {
    let payload: {
      purpose?: string;
      sub?: string;
      projectId?: string;
      connectorSlug?: string;
    };
    try {
      payload = await this.jwt.verifyAsync(state);
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }

    if (
      payload.purpose !== 'connector_oauth' ||
      !payload.sub ||
      !payload.projectId ||
      !payload.connectorSlug
    ) {
      throw new BadRequestException('Invalid OAuth state payload');
    }

    const adapter = resolveConnector(payload.connectorSlug);
    if (!adapter) {
      throw new BadRequestException('Unknown connector');
    }

    const tokens = await adapter.exchangeOAuthCode(code);
    if (!tokens.refreshToken) {
      throw new BadRequestException(
        'Google không trả refresh_token — thử thu hồi quyền app và kết nối lại (prompt=consent)',
      );
    }

    const clientSecrets = adapter.oauthClientSecrets();
    if (!clientSecrets) {
      throw new BadRequestException('Google OAuth not configured');
    }

    const row = await this.prisma.projectConnector.upsert({
      where: {
        projectId_connectorSlug: {
          projectId: payload.projectId,
          connectorSlug: adapter.slug,
        },
      },
      create: {
        projectId: payload.projectId,
        connectorSlug: adapter.slug,
        displayName: adapter.displayName,
        enabled: true,
        connectionStatus: ConnectorConnectionStatus.CONNECTED,
      },
      update: {
        enabled: true,
        connectionStatus: ConnectorConnectionStatus.CONNECTED,
        lastError: null,
      },
      include: { secrets: true },
    });

    const secretPayload = [
      { key: 'client_id', value: clientSecrets.clientId },
      { key: 'client_secret', value: clientSecrets.clientSecret },
      { key: 'refresh_token', value: tokens.refreshToken },
    ];
    for (const { key, value } of secretPayload) {
      await this.upsertSecret(payload.projectId, row.id, key, value);
    }

    await this.prisma.projectConnector.update({
      where: { id: row.id },
      data: { lastTestedAt: new Date(), lastError: null },
    });

    await this.syncOpenClawConfig(payload.projectId);

    const frontend = (
      process.env.FRONTEND_URL ?? 'http://localhost:8386'
    ).replace(/\/$/, '');
    const redirectUrl = `${frontend}/dashboard/connector/${adapter.slug}?connected=1`;
    return { redirectUrl };
  }

  async syncOpenClawConfig(projectId: string): Promise<void> {
    await this.workspace.syncProjectRuntime(projectId);
  }

  private async markTestResult(
    connectorId: string,
    ok: boolean,
    error: string | null,
  ) {
    await this.prisma.projectConnector.update({
      where: { id: connectorId },
      data: {
        lastTestedAt: new Date(),
        lastError: error,
        connectionStatus: ok
          ? ConnectorConnectionStatus.CONNECTED
          : ConnectorConnectionStatus.ERROR,
      },
    });
  }

  private async requireConnector(projectId: string, connectorId: string) {
    const row = await this.prisma.projectConnector.findFirst({
      where: { id: connectorId, projectId },
      include: { secrets: true },
    });
    if (!row) throw new NotFoundException('Connector not found');
    return row;
  }

  private decryptSecrets(
    secrets: Array<{ secretKey: string; ciphertext: string }>,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const s of secrets) {
      try {
        out[s.secretKey] = decryptSecret(s.ciphertext);
      } catch {
        // skip
      }
    }
    return out;
  }

  private toDto(row: ConnectorRowWithSecrets): ProjectConnectorDto {
    const adapter = resolveConnector(row.connectorSlug);
    return {
      id: row.id,
      projectId: row.projectId,
      connectorDefinitionId: adapter?.id ?? row.connectorSlug,
      connectorSlug: row.connectorSlug,
      connectorName: adapter?.displayName ?? row.displayName,
      connectorKind: adapter?.kind ?? 'OAUTH',
      displayName: row.displayName,
      enabled: row.enabled,
      connectionStatus: row.connectionStatus.toLowerCase(),
      config: row.config,
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
      lastError: row.lastError,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      secrets: row.secrets.map((s) => ({
        key: s.secretKey,
        updatedAt: s.updatedAt.toISOString(),
        masked: maskSecret(decryptSecret(s.ciphertext)),
      })),
      definition: adapter
        ? {
            description: adapter.description,
            status: adapter.status,
            configSchema: null,
          }
        : undefined,
    };
  }
}
