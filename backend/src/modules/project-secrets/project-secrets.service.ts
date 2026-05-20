import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';
import { SecretCryptoService } from '../../core/crypto/secret-crypto.service';
import { PrismaService } from '../../core/database/prisma.service';
import { UpsertSecretDto } from './dto/upsert-secret.dto';

@Injectable()
export class ProjectSecretsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly crypto: SecretCryptoService,
  ) {}

  async listKeys(userId: string, projectId: string) {
    await this.projects.assertProjectOwned(projectId, userId);
    const rows = await this.prisma.projectSecret.findMany({
      where: { projectId },
      select: { secretKey: true, updatedAt: true },
      orderBy: { secretKey: 'asc' },
    });
    return { keys: rows };
  }

  async upsert(userId: string, projectId: string, secretKey: string, dto: UpsertSecretDto) {
    await this.projects.assertProjectOwned(projectId, userId);
    const key = secretKey.trim().slice(0, 128);
    if (!key) throw new NotFoundException('secretKey required');
    const payloadEnc = this.crypto.encryptUtf8(dto.value);
    return this.prisma.projectSecret.upsert({
      where: {
        projectId_secretKey: { projectId, secretKey: key },
      },
      create: { projectId, secretKey: key, payloadEnc },
      update: { payloadEnc },
    });
  }

  async getDecrypted(userId: string, projectId: string, secretKey: string) {
    await this.projects.assertProjectOwned(projectId, userId);
    const row = await this.prisma.projectSecret.findUnique({
      where: {
        projectId_secretKey: { projectId, secretKey: secretKey.trim() },
      },
    });
    if (!row) throw new NotFoundException('Secret not found');
    return {
      secretKey: row.secretKey,
      value: this.crypto.decryptUtf8(row.payloadEnc),
      updatedAt: row.updatedAt,
    };
  }

  async remove(userId: string, projectId: string, secretKey: string) {
    await this.projects.assertProjectOwned(projectId, userId);
    try {
      await this.prisma.projectSecret.delete({
        where: {
          projectId_secretKey: { projectId, secretKey: secretKey.trim() },
        },
      });
    } catch {
      throw new NotFoundException('Secret not found');
    }
    return { deleted: true };
  }
}
