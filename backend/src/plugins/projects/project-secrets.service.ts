import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { SecretCryptoService } from '../../core/crypto/secret-crypto.service';
import {
  OPENCLAW_GATEWAY_TOKEN_KEY,
  PROJECT_MODEL_ENV_KEYS,
  isProjectModelEnvKey,
} from './project-secret.constants';

export type ProjectSecretTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class ProjectSecretsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: SecretCryptoService,
  ) {}

  /** All secrets for Docker `Env`, read inside the same transaction as create (uncommitted rows visible). */
  async buildDockerEnvMap(tx: ProjectSecretTx, projectId: string): Promise<Record<string, string>> {
    const keys = [OPENCLAW_GATEWAY_TOKEN_KEY, ...PROJECT_MODEL_ENV_KEYS] as string[];
    const rows = await tx.projectSecret.findMany({
      where: { projectId, secretKey: { in: keys } },
    });
    const out: Record<string, string> = {};
    for (const row of rows) {
      out[row.secretKey] = this.crypto.decryptUtf8(row.payloadEnc);
    }
    return out;
  }

  async ensureGatewayToken(
    tx: ProjectSecretTx,
    projectId: string,
  ): Promise<{ plainToken: string }> {
    const existing = await tx.projectSecret.findUnique({
      where: {
        projectId_secretKey: {
          projectId,
          secretKey: OPENCLAW_GATEWAY_TOKEN_KEY,
        },
      },
    });
    if (existing) {
      return { plainToken: this.crypto.decryptUtf8(existing.payloadEnc) };
    }
    const plainToken = crypto.randomBytes(32).toString('hex');
    await tx.projectSecret.create({
      data: {
        projectId,
        secretKey: OPENCLAW_GATEWAY_TOKEN_KEY,
        payloadEnc: this.crypto.encryptUtf8(plainToken),
      },
    });
    return { plainToken };
  }

  async getGatewayTokenPlain(projectId: string): Promise<string> {
    const row = await this.prisma.projectSecret.findUnique({
      where: {
        projectId_secretKey: {
          projectId,
          secretKey: OPENCLAW_GATEWAY_TOKEN_KEY,
        },
      },
    });
    if (!row) {
      throw new NotFoundException('Gateway token not provisioned for this project');
    }
    return this.crypto.decryptUtf8(row.payloadEnc);
  }

  async listEnvRowsForApi(projectId: string): Promise<Array<{ key: string; updatedAt: Date; masked: string }>> {
    const rows = await this.prisma.projectSecret.findMany({
      where: {
        projectId,
        secretKey: { in: [...PROJECT_MODEL_ENV_KEYS] },
      },
      orderBy: { secretKey: 'asc' },
    });
    return rows.map((r) => ({
      key: r.secretKey,
      updatedAt: r.updatedAt,
      masked: '••••••••••••',
    }));
  }

  async upsertEnvEntries(
    projectId: string,
    entries: Array<{ key: string; value: string }>,
  ): Promise<void> {
    for (const { key, value } of entries) {
      if (!isProjectModelEnvKey(key)) {
        throw new BadRequestException(`Secret key not allowed: ${key}`);
      }
      if (!value || value.length > 5000) {
        throw new BadRequestException(`Invalid value for ${key}`);
      }
      const payloadEnc = this.crypto.encryptUtf8(value);
      await this.prisma.projectSecret.upsert({
        where: { projectId_secretKey: { projectId, secretKey: key } },
        create: { projectId, secretKey: key, payloadEnc },
        update: { payloadEnc },
      });
    }
  }

  async deleteEnvKey(projectId: string, key: string): Promise<void> {
    const trimmed = key.trim();
    if (!isProjectModelEnvKey(trimmed)) {
      throw new BadRequestException(`Secret key not allowed: ${key}`);
    }
    try {
      await this.prisma.projectSecret.delete({
        where: { projectId_secretKey: { projectId, secretKey: trimmed } },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        return;
      }
      throw e;
    }
  }
}
