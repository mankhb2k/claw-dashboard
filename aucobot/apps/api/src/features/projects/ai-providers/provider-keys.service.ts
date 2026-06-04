import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  decryptSecret,
  encryptSecret,
  maskSecret,
} from '@aucobot/control-plane-core';
import { WorkspaceService } from '../workspace/workspace.service';
import { runProviderKeyTest } from './provider-test';
import { PROVIDER_REGISTRY, resolveProvider } from './provider-registry';

export type ProviderKeyMaskedRow = {
  key: string;
  providerId: string;
  label: string;
  masked: string;
  enabled: boolean;
  defaultModel: string | null;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastError: string | null;
  updatedAt: string;
};

@Injectable()
export class ProviderKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
  ) {}

  listDefinitions() {
    return PROVIDER_REGISTRY;
  }

  async revealApiKey(
    projectId: string,
    providerId: string,
  ): Promise<{ apiKey: string }> {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }

    const row = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: { projectId, providerId: provider.id },
      },
    });
    if (!row) {
      throw new NotFoundException('No API key stored for this provider');
    }

    return { apiKey: decryptSecret(row.ciphertext) };
  }

  async listMasked(projectId: string): Promise<ProviderKeyMaskedRow[]> {
    const rows = await this.prisma.projectProviderKey.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => ({
      key: row.envKey,
      providerId: row.providerId,
      label: row.label ?? row.envKey,
      masked: maskSecret(decryptSecret(row.ciphertext)),
      enabled: row.enabled,
      defaultModel: row.defaultModel,
      lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
      lastTestOk: row.lastTestOk,
      lastError: row.lastError,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async upsert(params: {
    projectId: string;
    providerId: string;
    apiKey: string;
    label?: string;
    defaultModel?: string;
    enabled?: boolean;
  }) {
    const provider = resolveProvider(params.providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${params.providerId}`);
    }
    const apiKey = params.apiKey.trim();
    if (apiKey.length < 8) {
      throw new BadRequestException('API key too short');
    }

    const enabled = params.enabled ?? false;

    const row = await this.prisma.projectProviderKey.upsert({
      where: {
        projectId_providerId: {
          projectId: params.projectId,
          providerId: provider.id,
        },
      },
      create: {
        projectId: params.projectId,
        providerId: provider.id,
        envKey: provider.envKey,
        label: params.label?.trim() || provider.displayName,
        ciphertext: encryptSecret(apiKey),
        enabled,
        defaultModel:
          params.defaultModel?.trim() || (provider.defaultModel ?? null),
      },
      update: {
        label: params.label?.trim() || provider.displayName,
        ciphertext: encryptSecret(apiKey),
        enabled,
        defaultModel:
          params.defaultModel?.trim() || (provider.defaultModel ?? null),
        lastError: null,
      },
    });

    await this.syncOpenClawConfig(params.projectId);

    return {
      providerId: row.providerId,
      envKey: row.envKey,
      masked: maskSecret(apiKey),
      enabled: row.enabled,
    };
  }

  /** Save key (enabled=false) → smoke test → enable if OK in timeout. */
  async saveAndTest(params: {
    projectId: string;
    providerId: string;
    apiKey: string;
    label?: string;
    defaultModel?: string;
  }) {
    await this.upsert({
      ...params,
      enabled: false,
    });
    return this.testProvider(params.projectId, params.providerId, {
      applyEnabled: true,
    });
  }

  async setEnabled(projectId: string, providerId: string, enabled: boolean) {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }

    const row = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: { projectId, providerId: provider.id },
      },
    });
    if (!row) {
      throw new NotFoundException('No API key stored for this provider');
    }

    if (!enabled) {
      await this.prisma.projectProviderKey.update({
        where: { id: row.id },
        data: { enabled: false },
      });
      await this.syncOpenClawConfig(projectId);
      return { ok: true, enabled: false };
    }

    const test = await this.testProvider(projectId, providerId, {
      applyEnabled: true,
    });
    return {
      ok: test.ok,
      enabled: test.ok,
      error: test.error,
      model: test.model,
      message: test.message,
    };
  }

  async deleteByProviderId(projectId: string, providerId: string) {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }

    const deleted = await this.prisma.projectProviderKey.deleteMany({
      where: { projectId, providerId: provider.id },
    });
    if (!deleted.count) {
      throw new NotFoundException('Provider key not found');
    }
    await this.syncOpenClawConfig(projectId);
  }

  async testProvider(
    projectId: string,
    providerId: string,
    options?: { applyEnabled?: boolean },
  ) {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }

    const row = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: { projectId, providerId: provider.id },
      },
    });
    if (!row) {
      throw new NotFoundException('No API key stored for this provider');
    }

    const apiKey = decryptSecret(row.ciphertext);
    const result = await runProviderKeyTest(provider.id, apiKey);
    const enabled = options?.applyEnabled ? result.ok : row.enabled;

    await this.prisma.projectProviderKey.update({
      where: { id: row.id },
      data: {
        lastTestedAt: new Date(),
        lastTestOk: result.ok,
        lastError: result.ok ? null : (result.error ?? 'Test failed'),
        enabled,
      },
    });

    await this.syncOpenClawConfig(projectId);

    return {
      ...result,
      enabled,
      masked: maskSecret(apiKey),
      providerId: provider.id,
      envKey: provider.envKey,
    };
  }

  async syncOpenClawConfig(projectId: string): Promise<void> {
    await this.workspace.syncProjectRuntime(projectId);
  }

  async setDefaultModel(
    projectId: string,
    providerId: string,
    defaultModel: string,
  ): Promise<void> {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }
    const trimmed = defaultModel.trim();
    if (!trimmed) {
      throw new BadRequestException('defaultModel is required');
    }

    const row = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: { projectId, providerId: provider.id },
      },
    });
    if (!row) {
      throw new NotFoundException('No API key stored for this provider');
    }
    if (!row.enabled) {
      throw new BadRequestException(
        `Provider ${provider.displayName} is not enabled`,
      );
    }

    await this.prisma.projectProviderKey.update({
      where: { id: row.id },
      data: {
        defaultModel: trimmed,
        updatedAt: new Date(),
      },
    });

    await this.syncOpenClawConfig(projectId);
  }

  resolveProviderIdFromEnvKey(envKey: string): string | undefined {
    return resolveProvider(envKey)?.id;
  }
}
