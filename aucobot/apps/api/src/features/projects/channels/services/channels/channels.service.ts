import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChannelConnectionStatus } from '@aucobot/database';
import { PrismaService } from '../../../../../core/database/prisma.service';
import { decryptSecret, encryptSecret, maskSecret } from '@aucobot/control-plane-core';
import { WorkspaceService } from '../../../workspace/services/workspace/workspace.service';
import { listActiveChannels, resolveChannel } from '../../lib/channel-registry';
import type { ChannelAdapter } from '../../lib/channel-adapter.types';
import type { ChannelDto } from '../../lib/channels.types';

export type { ChannelDto } from '../../lib/channels.types';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  listDefinitions() {
    const now = new Date().toISOString();
    return listActiveChannels().map((def) => ({
      id: def.id,
      channelId: def.id,
      displayName: def.displayName,
      description: def.description,
      kind: def.kind,
      status: def.status,
      secretKeys: def.secretKeys,
      docsPath: def.docsPath ?? null,
      createdAt: now,
      updatedAt: now,
    }));
  }

  async list(projectId: string): Promise<ChannelDto[]> {
    const rows = await this.prisma.projectChannel.findMany({
      where: { projectId },
      include: { secrets: true },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => this.toDto(row));
  }

  async create(
    projectId: string,
    input: { channelId: string; enabled?: boolean; config?: Record<string, unknown> },
  ): Promise<ChannelDto> {
    const def = resolveChannel(input.channelId);
    if (!def) {
      throw new BadRequestException(`Unknown channel: ${input.channelId}`);
    }

    const existing = await this.prisma.projectChannel.findUnique({
      where: { projectId_channelId: { projectId, channelId: def.id } },
    });
    if (existing) {
      throw new ConflictException('Channel already exists for this project');
    }

    const row = await this.prisma.projectChannel.create({
      data: {
        projectId,
        channelId: def.id,
        enabled: Boolean(input.enabled),
        connectionStatus: ChannelConnectionStatus.DISCONNECTED,
        config: this.normalizeChannelConfig(
          def,
          {},
          (input.config ?? def.defaultConfig()) as Record<string, unknown>,
        ) as object,
      },
      include: { secrets: true },
    });

    return this.toDto(row);
  }

  async getOrCreate(projectId: string, channelId: string): Promise<ChannelDto> {
    const def = resolveChannel(channelId);
    if (!def) {
      throw new BadRequestException(`Unknown channel: ${channelId}`);
    }

    const row = await this.prisma.projectChannel.upsert({
      where: { projectId_channelId: { projectId, channelId: def.id } },
      create: {
        projectId,
        channelId: def.id,
        enabled: false,
        connectionStatus: ChannelConnectionStatus.DISCONNECTED,
        config: def.defaultConfig() as object,
      },
      update: {},
      include: { secrets: true },
    });

    return this.toDto(row);
  }

  async update(
    projectId: string,
    channelRowId: string,
    input: { enabled?: boolean; config?: Record<string, unknown> },
  ): Promise<ChannelDto> {
    const row = await this.requireChannel(projectId, channelRowId);
    const def = resolveChannel(row.channelId);
    const data: {
      enabled?: boolean;
      config?: object;
      connectionStatus?: ChannelConnectionStatus;
    } = {};

    if (input.config !== undefined) {
      if (!def) {
        throw new BadRequestException(`Unknown channel: ${row.channelId}`);
      }
      data.config = this.normalizeChannelConfig(def, row.config, input.config) as object;
    }

    if (input.enabled !== undefined) {
      data.enabled = input.enabled;
      if (!input.enabled) {
        data.connectionStatus = ChannelConnectionStatus.DISCONNECTED;
      } else if (row.connectionStatus !== ChannelConnectionStatus.CONNECTED) {
        throw new BadRequestException('Channel is not connected — save token and run test first');
      }
    }

    const updated = await this.prisma.projectChannel.update({
      where: { id: row.id },
      data,
      include: { secrets: true },
    });

    if (input.enabled !== undefined || input.config !== undefined) {
      await this.syncOpenClawConfig(projectId);
    }

    return this.toDto(updated);
  }

  async delete(projectId: string, channelRowId: string): Promise<void> {
    const row = await this.requireChannel(projectId, channelRowId);
    await this.prisma.projectChannel.delete({ where: { id: row.id } });
    await this.syncOpenClawConfig(projectId);
  }

  async upsertSecret(
    projectId: string,
    channelRowId: string,
    secretKey: string,
    value: string,
  ): Promise<void> {
    const row = await this.requireChannel(projectId, channelRowId);
    const def = resolveChannel(row.channelId);
    const key = secretKey.trim();
    if (!key) throw new BadRequestException('secretKey required');
    if (def && !def.secretKeys.includes(key)) {
      throw new BadRequestException(`Unknown secret key for ${row.channelId}: ${key}`);
    }

    await this.prisma.projectChannelSecret.upsert({
      where: {
        projectChannelId_secretKey: { projectChannelId: row.id, secretKey: key },
      },
      create: {
        projectChannelId: row.id,
        secretKey: key,
        ciphertext: encryptSecret(value),
      },
      update: { ciphertext: encryptSecret(value) },
    });

    await this.prisma.projectChannel.update({
      where: { id: row.id },
      data: {
        connectionStatus: ChannelConnectionStatus.CONFIGURED,
        lastError: null,
      },
    });
  }

  async deleteSecret(
    projectId: string,
    channelRowId: string,
    secretKey: string,
  ): Promise<void> {
    const row = await this.requireChannel(projectId, channelRowId);
    const key = secretKey.trim();
    if (!key) throw new BadRequestException('secretKey required');

    await this.prisma.projectChannelSecret.deleteMany({
      where: { projectChannelId: row.id, secretKey: key },
    });

    await this.prisma.projectChannel.update({
      where: { id: row.id },
      data: {
        connectionStatus: ChannelConnectionStatus.DISCONNECTED,
        enabled: false,
      },
    });

    await this.syncOpenClawConfig(projectId);
  }

  async test(
    projectId: string,
    channelRowId: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const row = await this.requireChannel(projectId, channelRowId);
    const def = resolveChannel(row.channelId);
    if (!def) {
      throw new BadRequestException(`Unknown channel: ${row.channelId}`);
    }

    const secrets = this.decryptSecrets(row.secrets);
    const config = (row.config ?? {}) as Record<string, unknown>;
    const result = await def.testConnection(secrets, config);

    if (result.ok) {
      const nextConfig = { ...config, ...(result.metadata ?? {}) };
      await this.prisma.projectChannel.update({
        where: { id: row.id },
        data: {
          connectionStatus: ChannelConnectionStatus.CONNECTED,
          lastTestedAt: new Date(),
          lastError: null,
          config: nextConfig as object,
        },
      });
      await this.syncOpenClawConfig(projectId);
    } else {
      await this.markTestResult(row.id, false, result.message ?? 'Test failed');
    }

    return { ok: result.ok, message: result.message };
  }

  private normalizeChannelConfig(
    def: ChannelAdapter,
    existing: unknown,
    patch: Record<string, unknown>,
  ): Record<string, unknown> {
    try {
      return def.normalizeConfig(existing, patch);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid channel config',
      );
    }
  }

  private async syncOpenClawConfig(projectId: string): Promise<void> {
    await this.workspace.syncProjectRuntime(projectId);
    await this.prisma.projectChannel.updateMany({
      where: { projectId, enabled: true, connectionStatus: ChannelConnectionStatus.CONNECTED },
      data: { lastSyncedAt: new Date() },
    });
  }

  private async markTestResult(channelRowId: string, ok: boolean, message: string | null) {
    await this.prisma.projectChannel.update({
      where: { id: channelRowId },
      data: {
        connectionStatus: ok ? ChannelConnectionStatus.CONNECTED : ChannelConnectionStatus.ERROR,
        lastTestedAt: new Date(),
        lastError: message,
      },
    });
  }

  private async requireChannel(projectId: string, channelRowId: string) {
    const row = await this.prisma.projectChannel.findFirst({
      where: { id: channelRowId, projectId },
      include: { secrets: true },
    });
    if (!row) throw new NotFoundException('Channel not found');
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

  private toDto(
    row: {
      id: string;
      projectId: string;
      channelId: string;
      enabled: boolean;
      connectionStatus: ChannelConnectionStatus;
      config: unknown;
      lastTestedAt: Date | null;
      lastError: string | null;
      lastSyncedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      secrets: Array<{ secretKey: string; ciphertext: string; updatedAt: Date }>;
    },
  ): ChannelDto {
    const def = resolveChannel(row.channelId);
    return {
      id: row.id,
      projectId: row.projectId,
      channelId: row.channelId,
      channelName: def?.displayName ?? row.channelId,
      channelKind: def?.kind ?? 'BOT_TOKEN',
      enabled: row.enabled,
      connectionStatus: row.connectionStatus.toLowerCase() as ChannelDto['connectionStatus'],
      config: row.config,
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
      lastError: row.lastError,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      secrets: row.secrets.map((s) => ({
        key: s.secretKey,
        updatedAt: s.updatedAt.toISOString(),
        masked: maskSecret(decryptSecret(s.ciphertext)),
      })),
      definition: def
        ? { description: def.description, kind: def.kind, docsPath: def.docsPath }
        : undefined,
    };
  }
}
