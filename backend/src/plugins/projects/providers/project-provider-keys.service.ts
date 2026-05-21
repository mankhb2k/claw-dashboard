import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import path from 'node:path';
import { PrismaService } from '../../../core/database/prisma.service';
import { decryptSecret, encryptSecret, maskSecret } from '../../../core/crypto/secret-crypto';
import { ProjectWorkspaceService } from '../workspace/project-workspace.service';
import {
  mergeProviderKeysIntoConfig,
  readOpenClawConfigJson,
  removeLegacyDotEnv,
  writeOpenClawConfigJson,
} from '../workspace/openclaw-config-merge';
import { testGeminiApiKey } from './gemini-test';
import { PROVIDER_REGISTRY, resolveProvider } from './provider-registry';

@Injectable()
export class ProjectProviderKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: ProjectWorkspaceService,
  ) {}

  listDefinitions() {
    return PROVIDER_REGISTRY;
  }

  async listMasked(projectId: string) {
    const rows = await this.prisma.projectProviderKey.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((row) => ({
      key: row.envKey,
      providerId: row.providerId,
      label: row.label,
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
  }) {
    const provider = resolveProvider(params.providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${params.providerId}`);
    }
    const apiKey = params.apiKey.trim();
    if (apiKey.length < 8) {
      throw new BadRequestException('API key too short');
    }

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
        enabled: true,
        defaultModel: params.defaultModel?.trim() || (provider.defaultModel ?? null),
      },
      update: {
        label: params.label?.trim() || provider.displayName,
        ciphertext: encryptSecret(apiKey),
        enabled: true,
        defaultModel: params.defaultModel?.trim() || (provider.defaultModel ?? null),
        lastError: null,
      },
    });

    await this.syncOpenClawConfig(params.projectId);

    return {
      providerId: row.providerId,
      envKey: row.envKey,
      masked: maskSecret(apiKey),
    };
  }

  async deleteByEnvKey(projectId: string, envKey: string) {
    const deleted = await this.prisma.projectProviderKey.deleteMany({
      where: { projectId, envKey },
    });
    if (!deleted.count) {
      throw new NotFoundException('Provider key not found');
    }
    await this.syncOpenClawConfig(projectId);
  }

  async testProvider(projectId: string, providerId: string) {
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
    let result: { ok: boolean; model?: string; message?: string; error?: string };

    if (provider.id === 'gemini') {
      result = await testGeminiApiKey(apiKey);
    } else {
      result = { ok: false, error: `Test not implemented for provider ${provider.id}` };
    }

    await this.prisma.projectProviderKey.update({
      where: { id: row.id },
      data: {
        lastTestedAt: new Date(),
        lastTestOk: result.ok,
        lastError: result.ok ? null : (result.error ?? 'Test failed'),
      },
    });

    return result;
  }

  /** Đồng bộ API keys + default model vào `openclaw.json.env` (gateway watch reload). */
  async syncOpenClawConfig(projectId: string): Promise<void> {
    const dataDir = await this.workspace.ensureProjectLayout(projectId);
    const configPath = path.join(dataDir, 'openclaw.json');
    const config = (await readOpenClawConfigJson(configPath)) ?? {};
    const rows = await this.prisma.projectProviderKey.findMany({
      where: { projectId },
    });

    mergeProviderKeysIntoConfig(config, rows, decryptSecret);
    await writeOpenClawConfigJson(configPath, config);
    await removeLegacyDotEnv(dataDir);
  }

  resolveProviderIdFromEnvKey(envKey: string): string | undefined {
    return resolveProvider(envKey)?.id;
  }
}
