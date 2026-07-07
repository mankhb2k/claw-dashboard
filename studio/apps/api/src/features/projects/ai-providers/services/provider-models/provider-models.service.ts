import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../../core/database/prisma.service';
import {
  openclawProviderPrefix,
  resolveProvider,
} from '../../lib/provider-registry';
import { ProviderKeysService } from '../provider-keys/provider-keys.service';

export type ProviderModelRow = {
  id: string;
  providerId: string;
  openclawId: string;
  displayName: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ProviderModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerKeys: ProviderKeysService,
  ) {}

  private assertAiProvider(providerId: string) {
    const provider = resolveProvider(providerId);
    if (!provider) {
      throw new BadRequestException(`Unknown provider: ${providerId}`);
    }
    if (provider.uiGroup !== 'ai-provider') {
      throw new BadRequestException(
        `Provider ${provider.displayName} does not support user-managed models`,
      );
    }
    return provider;
  }

  private async assertStoredKey(projectId: string, providerId: string) {
    const provider = this.assertAiProvider(providerId);
    const keyRow = await this.prisma.projectProviderKey.findUnique({
      where: {
        projectId_providerId: { projectId, providerId: provider.id },
      },
    });
    if (!keyRow) {
      throw new BadRequestException(
        `Add an API key for ${provider.displayName} before managing models`,
      );
    }
    return { provider, keyRow };
  }

  private validateOpenclawId(providerId: string, openclawId: string): string {
    const provider = this.assertAiProvider(providerId);
    const trimmed = openclawId.trim();
    const prefix = `${openclawProviderPrefix(provider)}/`;
    if (!trimmed.startsWith(prefix)) {
      throw new BadRequestException(`Model ref must start with "${prefix}"`);
    }
    if (trimmed.length <= prefix.length) {
      throw new BadRequestException('Model ref is incomplete');
    }
    return trimmed;
  }

  async list(
    projectId: string,
    providerId: string,
  ): Promise<ProviderModelRow[]> {
    const provider = this.assertAiProvider(providerId);
    const rows = await this.prisma.projectProviderModel.findMany({
      where: { projectId, providerId: provider.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.id,
      providerId: row.providerId,
      openclawId: row.openclawId,
      displayName: row.displayName,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async add(params: {
    projectId: string;
    providerId: string;
    openclawId: string;
    displayName?: string;
    setDefault?: boolean;
  }): Promise<ProviderModelRow> {
    const { provider } = await this.assertStoredKey(
      params.projectId,
      params.providerId,
    );
    const openclawId = this.validateOpenclawId(
      params.providerId,
      params.openclawId,
    );
    const setDefault = params.setDefault ?? false;

    const existingCount = await this.prisma.projectProviderModel.count({
      where: { projectId: params.projectId, providerId: provider.id },
    });

    const row = await this.prisma.$transaction(async (tx) => {
      if (setDefault || existingCount === 0) {
        await tx.projectProviderModel.updateMany({
          where: { projectId: params.projectId, providerId: provider.id },
          data: { isDefault: false },
        });
      }

      const created = await tx.projectProviderModel.upsert({
        where: {
          projectId_providerId_openclawId: {
            projectId: params.projectId,
            providerId: provider.id,
            openclawId,
          },
        },
        create: {
          projectId: params.projectId,
          providerId: provider.id,
          openclawId,
          displayName: params.displayName?.trim() || null,
          isDefault: setDefault || existingCount === 0,
        },
        update: {
          displayName: params.displayName?.trim() || null,
          ...(setDefault || existingCount === 0 ? { isDefault: true } : {}),
        },
      });

      if (created.isDefault) {
        await tx.projectProviderKey.update({
          where: {
            projectId_providerId: {
              projectId: params.projectId,
              providerId: provider.id,
            },
          },
          data: { defaultModel: openclawId, updatedAt: new Date() },
        });
      }

      return created;
    });

    await this.providerKeys.syncOpenClawConfig(params.projectId);

    return {
      id: row.id,
      providerId: row.providerId,
      openclawId: row.openclawId,
      displayName: row.displayName,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async update(params: {
    projectId: string;
    providerId: string;
    modelId: string;
    displayName?: string;
    setDefault?: boolean;
  }): Promise<ProviderModelRow> {
    const { provider } = await this.assertStoredKey(
      params.projectId,
      params.providerId,
    );

    const existing = await this.prisma.projectProviderModel.findFirst({
      where: {
        id: params.modelId,
        projectId: params.projectId,
        providerId: provider.id,
      },
    });
    if (!existing) {
      throw new NotFoundException('Model not found');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      if (params.setDefault) {
        await tx.projectProviderModel.updateMany({
          where: { projectId: params.projectId, providerId: provider.id },
          data: { isDefault: false },
        });
      }

      const updated = await tx.projectProviderModel.update({
        where: { id: existing.id },
        data: {
          displayName:
            params.displayName !== undefined
              ? params.displayName.trim() || null
              : undefined,
          ...(params.setDefault ? { isDefault: true } : {}),
        },
      });

      if (params.setDefault) {
        await tx.projectProviderKey.update({
          where: {
            projectId_providerId: {
              projectId: params.projectId,
              providerId: provider.id,
            },
          },
          data: { defaultModel: updated.openclawId, updatedAt: new Date() },
        });
      }

      return updated;
    });

    await this.providerKeys.syncOpenClawConfig(params.projectId);

    return {
      id: row.id,
      providerId: row.providerId,
      openclawId: row.openclawId,
      displayName: row.displayName,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async delete(
    projectId: string,
    providerId: string,
    modelId: string,
  ): Promise<void> {
    const { provider } = await this.assertStoredKey(projectId, providerId);
    const existing = await this.prisma.projectProviderModel.findFirst({
      where: { id: modelId, projectId, providerId: provider.id },
    });
    if (!existing) {
      throw new NotFoundException('Model not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectProviderModel.delete({ where: { id: existing.id } });

      if (!existing.isDefault) return;

      const next = await tx.projectProviderModel.findFirst({
        where: { projectId, providerId: provider.id },
        orderBy: { createdAt: 'asc' },
      });

      if (next) {
        await tx.projectProviderModel.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
        await tx.projectProviderKey.update({
          where: {
            projectId_providerId: { projectId, providerId: provider.id },
          },
          data: { defaultModel: next.openclawId },
        });
      } else {
        await tx.projectProviderKey.update({
          where: {
            projectId_providerId: { projectId, providerId: provider.id },
          },
          data: { defaultModel: provider.defaultModel ?? null },
        });
      }
    });

    await this.providerKeys.syncOpenClawConfig(projectId);
  }
}
