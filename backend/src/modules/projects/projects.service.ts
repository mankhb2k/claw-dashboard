import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const mkSlug = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 14);

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertProjectOwned(projectId: string, userId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async create(userId: string, dto: CreateProjectDto) {
    const requested = dto.slug?.trim();
    for (let i = 0; i < 12; i++) {
      const slug = requested || mkSlug();
      try {
        return await this.prisma.project.create({
          data: {
            userId,
            slug,
            displayName: dto.displayName.trim(),
            syncPathHint: dto.syncPathHint?.trim() || null,
          },
        });
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          if (requested) throw new ConflictException('Slug already taken');
          continue;
        }
        throw e;
      }
    }
    throw new ConflictException('Could not allocate unique slug');
  }

  findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(projectId: string, userId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.assertProjectOwned(projectId, userId);
    if (dto.slug) {
      const taken = await this.prisma.project.findFirst({
        where: { slug: dto.slug, NOT: { id: projectId } },
      });
      if (taken) throw new ConflictException('Slug already taken');
    }
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.displayName != null && { displayName: dto.displayName.trim() }),
        ...(dto.slug != null && { slug: dto.slug }),
        ...(dto.syncPathHint !== undefined && {
          syncPathHint: dto.syncPathHint?.trim() || null,
        }),
        ...(dto.lifecycle != null && { lifecycle: dto.lifecycle }),
      },
    });
  }

  async remove(projectId: string, userId: string) {
    await this.assertProjectOwned(projectId, userId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { deleted: true };
  }
}
