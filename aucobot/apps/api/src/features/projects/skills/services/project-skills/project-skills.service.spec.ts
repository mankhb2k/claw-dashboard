import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  rm: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('@aucobot/workspace-sync', () => ({
  buildSkillMarkdown: jest.fn(() => '# Skill content'),
  MAX_SKILL_BODY_BYTES: 256_000,
  validateSkillSlug: (slug: string) => slug.trim().toLowerCase(),
  validateSkillName: (name: string) => name.trim().toLowerCase(),
}));

import { buildSkillMarkdown } from '@aucobot/workspace-sync';
import { ProjectSkillsService } from './project-skills.service';

const PROJECT_ID = 'proj_test_1';
const DATA_DIR = '/data/proj_test_1';
const SKILL_SLUG = 'my-skill';

const baseRow = {
  id: 'skill-1',
  projectId: PROJECT_ID,
  slug: SKILL_SLUG,
  name: 'my-skill',
  description: 'Does something',
  heading: 'My Skill',
  bodyMarkdown: 'Body text',
  enabled: true,
  lastSyncedAt: null as Date | null,
  lastSyncError: null as string | null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

function createService() {
  const prisma = {
    projectSkill: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const workspace = {
    ensureProjectLayout: jest.fn().mockResolvedValue(DATA_DIR),
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ProjectSkillsService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

describe('ProjectSkillsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns project skills ordered by updatedAt desc', async () => {
      const { service, prisma } = createService();
      prisma.projectSkill.findMany.mockResolvedValue([baseRow]);

      const rows = await service.list(PROJECT_ID);

      expect(prisma.projectSkill.findMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID },
        orderBy: { updatedAt: 'desc' },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.slug).toBe(SKILL_SLUG);
    });
  });

  describe('get', () => {
    it('throws when skill is missing', async () => {
      const { service, prisma } = createService();
      prisma.projectSkill.findUnique.mockResolvedValue(null);

      await expect(service.get(PROJECT_ID, SKILL_SLUG)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates disabled skill without disk sync', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectSkill.findUnique.mockResolvedValue(null);
      prisma.projectSkill.create.mockResolvedValue({ ...baseRow, enabled: false });

      const result = await service.create({
        projectId: PROJECT_ID,
        slug: SKILL_SLUG,
        name: 'my-skill',
        description: 'Does something',
      });

      expect(result.enabled).toBe(false);
      expect(writeFile).not.toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).not.toHaveBeenCalled();
    });

    it('syncs to disk when enabled on create', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectSkill.findUnique.mockResolvedValue(null);
      prisma.projectSkill.create.mockResolvedValue(baseRow);
      prisma.projectSkill.update.mockResolvedValue({
        ...baseRow,
        lastSyncedAt: new Date(),
      });

      await service.create({
        projectId: PROJECT_ID,
        slug: SKILL_SLUG,
        name: 'my-skill',
        description: 'Does something',
        enabled: true,
      });

      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(buildSkillMarkdown).toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('rejects duplicate slug', async () => {
      const { service, prisma } = createService();
      prisma.projectSkill.findUnique.mockResolvedValue(baseRow);

      await expect(
        service.create({
          projectId: PROJECT_ID,
          slug: SKILL_SLUG,
          name: 'my-skill',
          description: 'Does something',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects oversized body', async () => {
      const { service } = createService();

      await expect(
        service.create({
          projectId: PROJECT_ID,
          slug: SKILL_SLUG,
          name: 'my-skill',
          description: 'Does something',
          bodyMarkdown: 'x'.repeat(256_001),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('removes disk folder when disabled', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectSkill.findUnique.mockResolvedValue(baseRow);
      prisma.projectSkill.update
        .mockResolvedValueOnce({ ...baseRow, enabled: false })
        .mockResolvedValueOnce({ ...baseRow, enabled: false, lastSyncedAt: new Date() });

      await service.update(PROJECT_ID, SKILL_SLUG, { enabled: false });

      expect(rm).toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('delete', () => {
    it('removes disk folder and deletes row', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectSkill.findUnique.mockResolvedValue(baseRow);
      prisma.projectSkill.delete.mockResolvedValue(baseRow);

      await service.delete(PROJECT_ID, SKILL_SLUG);

      expect(rm).toHaveBeenCalled();
      expect(prisma.projectSkill.delete).toHaveBeenCalledWith({ where: { id: baseRow.id } });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('syncAllEnabled', () => {
    it('counts synced and failed skills', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectSkill.findMany.mockResolvedValue([
        baseRow,
        { ...baseRow, id: 'skill-2', slug: 'broken', lastSyncError: null },
      ]);
      prisma.projectSkill.update
        .mockResolvedValueOnce({ ...baseRow, lastSyncedAt: new Date(), lastSyncError: null })
        .mockResolvedValueOnce({
          ...baseRow,
          id: 'skill-2',
          slug: 'broken',
          lastSyncError: 'disk error',
        });

      const result = await service.syncAllEnabled(PROJECT_ID);

      expect(result).toEqual({ synced: 1, failed: 1 });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });
});
