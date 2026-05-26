import { BadRequestException, NotFoundException } from '@nestjs/common';
import { runProviderKeyTest } from './provider-test';

jest.mock('../workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('./provider-test', () => ({
  runProviderKeyTest: jest.fn(),
}));

import { ProviderKeysService } from './provider-keys.service';

jest.mock('@aucobot/control-plane-core', () => ({
  encryptSecret: (plaintext: string) => `enc:${plaintext}`,
  decryptSecret: (ciphertext: string) => ciphertext.replace(/^enc:/, ''),
  maskSecret: (value: string) => `***${value.slice(-4)}`,
}));

const runProviderKeyTestMock = runProviderKeyTest as jest.MockedFunction<
  typeof runProviderKeyTest
>;

const PROJECT_ID = 'proj_test_1';

function buildRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'row-1',
    projectId: PROJECT_ID,
    providerId: 'gemini',
    envKey: 'GEMINI_API_KEY',
    label: 'Gemini',
    ciphertext: 'enc:abcdefghijklmnop',
    enabled: false,
    defaultModel: 'google/gemini-2.5-flash',
    lastTestedAt: null,
    lastTestOk: null,
    lastError: null,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const prisma = {
    projectProviderKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ProviderKeysService(
    prisma as never,
    workspace as never,
  );
  return { service, prisma, workspace };
}

describe('ProviderKeysService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listDefinitions', () => {
    it('returns static provider registry', () => {
      const { service } = createService();
      const defs = service.listDefinitions();
      expect(defs.some((p) => p.id === 'gemini')).toBe(true);
      expect(defs.some((p) => p.id === 'openai')).toBe(true);
    });
  });

  describe('upsert', () => {
    it('rejects unknown provider', async () => {
      const { service } = createService();
      await expect(
        service.upsert({
          projectId: PROJECT_ID,
          providerId: 'unknown-vendor',
          apiKey: '12345678',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects api key shorter than 8 characters', async () => {
      const { service } = createService();
      await expect(
        service.upsert({
          projectId: PROJECT_ID,
          providerId: 'gemini',
          apiKey: 'short',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('upserts row and syncs openclaw config', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow();
      prisma.projectProviderKey.upsert.mockResolvedValue(row);

      const result = await service.upsert({
        projectId: PROJECT_ID,
        providerId: 'gemini',
        apiKey: 'abcdefghijklmnop',
        label: 'My key',
      });

      expect(prisma.projectProviderKey.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId_providerId: {
              projectId: PROJECT_ID,
              providerId: 'gemini',
            },
          },
          create: expect.objectContaining({
            envKey: 'GEMINI_API_KEY',
            ciphertext: 'enc:abcdefghijklmnop',
            enabled: false,
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(result).toMatchObject({
        providerId: 'gemini',
        envKey: 'GEMINI_API_KEY',
        enabled: false,
      });
      expect(result.masked).toContain('***');
    });
  });

  describe('saveAndTest', () => {
    it('upserts disabled then tests with applyEnabled', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow();
      prisma.projectProviderKey.upsert.mockResolvedValue(row);
      prisma.projectProviderKey.findUnique.mockResolvedValue(row);
      runProviderKeyTestMock.mockResolvedValue({
        ok: true,
        model: 'gemini-2.5-flash',
        message: 'ok',
      });
      prisma.projectProviderKey.update.mockResolvedValue({
        ...row,
        enabled: true,
        lastTestOk: true,
      });

      const result = await service.saveAndTest({
        projectId: PROJECT_ID,
        providerId: 'gemini',
        apiKey: 'abcdefghijklmnop',
      });

      expect(runProviderKeyTestMock).toHaveBeenCalledWith(
        'gemini',
        'abcdefghijklmnop',
      );
      expect(result.ok).toBe(true);
      expect(result.enabled).toBe(true);
      expect(workspace.syncProjectRuntime).toHaveBeenCalled();
    });
  });

  describe('testProvider', () => {
    it('throws when no stored key', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.findUnique.mockResolvedValue(null);

      await expect(
        service.testProvider(PROJECT_ID, 'gemini'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('records failed test without forcing enabled', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow({ enabled: false });
      prisma.projectProviderKey.findUnique.mockResolvedValue(row);
      runProviderKeyTestMock.mockResolvedValue({
        ok: false,
        error: 'Invalid API key',
      });
      prisma.projectProviderKey.update.mockResolvedValue({
        ...row,
        lastTestOk: false,
        lastError: 'Invalid API key',
      });

      const result = await service.testProvider(PROJECT_ID, 'gemini');

      expect(result.ok).toBe(false);
      expect(result.enabled).toBe(false);
      expect(prisma.projectProviderKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastTestOk: false,
            lastError: 'Invalid API key',
            enabled: false,
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('sets enabled when applyEnabled and test passes', async () => {
      const { service, prisma } = createService();
      const row = buildRow();
      prisma.projectProviderKey.findUnique.mockResolvedValue(row);
      runProviderKeyTestMock.mockResolvedValue({ ok: true, message: 'ok' });
      prisma.projectProviderKey.update.mockResolvedValue({
        ...row,
        enabled: true,
      });

      const result = await service.testProvider(PROJECT_ID, 'openai', {
        applyEnabled: true,
      });

      expect(runProviderKeyTestMock).toHaveBeenCalledWith('openai', expect.any(String));
      expect(result.enabled).toBe(true);
      expect(prisma.projectProviderKey.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ enabled: true }),
        }),
      );
    });
  });

  describe('setEnabled', () => {
    it('disables without running provider test', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow({ enabled: true });
      prisma.projectProviderKey.findUnique.mockResolvedValue(row);
      prisma.projectProviderKey.update.mockResolvedValue({
        ...row,
        enabled: false,
      });

      const result = await service.setEnabled(PROJECT_ID, 'gemini', false);

      expect(result).toEqual({ ok: true, enabled: false });
      expect(runProviderKeyTestMock).not.toHaveBeenCalled();
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('runs test before enabling', async () => {
      const { service, prisma } = createService();
      const row = buildRow();
      prisma.projectProviderKey.findUnique.mockResolvedValue(row);
      runProviderKeyTestMock.mockResolvedValue({ ok: true, message: 'ok' });
      prisma.projectProviderKey.update.mockResolvedValue({
        ...row,
        enabled: true,
      });

      const result = await service.setEnabled(PROJECT_ID, 'gemini', true);

      expect(runProviderKeyTestMock).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      expect(result.enabled).toBe(true);
    });
  });

  describe('deleteByProviderId', () => {
    it('throws when nothing deleted', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        service.deleteByProviderId(PROJECT_ID, 'gemini'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes row and syncs config', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectProviderKey.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteByProviderId(PROJECT_ID, 'gemini');

      expect(prisma.projectProviderKey.deleteMany).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID, providerId: 'gemini' },
      });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('listMasked', () => {
    it('maps db rows to masked response', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.findMany.mockResolvedValue([buildRow()]);

      const rows = await service.listMasked(PROJECT_ID);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        key: 'GEMINI_API_KEY',
        providerId: 'gemini',
        enabled: false,
      });
      expect(rows[0].masked).toMatch(/^\*\*\*/);
    });
  });

  describe('setDefaultModel', () => {
    it('requires enabled provider', async () => {
      const { service, prisma } = createService();
      prisma.projectProviderKey.findUnique.mockResolvedValue(
        buildRow({ enabled: false }),
      );

      await expect(
        service.setDefaultModel(PROJECT_ID, 'gemini', 'google/gemini-2.5-flash'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates default model when enabled', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow({ enabled: true });
      prisma.projectProviderKey.findUnique.mockResolvedValue(row);
      prisma.projectProviderKey.update.mockResolvedValue(row);

      await service.setDefaultModel(
        PROJECT_ID,
        'gemini',
        'google/gemini-2.5-pro',
      );

      expect(prisma.projectProviderKey.update).toHaveBeenCalledWith({
        where: { id: row.id },
        data: expect.objectContaining({
          defaultModel: 'google/gemini-2.5-pro',
        }),
      });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('resolveProviderIdFromEnvKey', () => {
    it('resolves env key to provider id', () => {
      const { service } = createService();
      expect(service.resolveProviderIdFromEnvKey('GEMINI_API_KEY')).toBe('gemini');
      expect(service.resolveProviderIdFromEnvKey('unknown')).toBeUndefined();
    });
  });
});
