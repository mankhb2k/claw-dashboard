import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ChannelConnectionStatus } from '@aucobot/database';

jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('@aucobot/control-plane-core', () => ({
  encryptSecret: (plaintext: string) => `enc:${plaintext}`,
  decryptSecret: (ciphertext: string) => ciphertext.replace(/^enc:/, ''),
  maskSecret: (value: string) => `***${value.slice(-4)}`,
}));

const testConnectionMock = jest.fn();

const mockAdapter = {
  id: 'telegram',
  displayName: 'Telegram',
  description: 'Telegram bot',
  kind: 'BOT_TOKEN' as const,
  status: 'ACTIVE' as const,
  secretKeys: ['bot_token'],
  docsPath: '/channels/telegram',
  defaultConfig: () => ({ dmPolicy: 'allowlist', allowFrom: [] as string[] }),
  normalizeConfig: (existing: unknown, patch: Record<string, unknown>) => {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    return { ...base, ...patch };
  },
  testConnection: testConnectionMock,
  buildOpenClawConfig: jest.fn(),
};

jest.mock('../../lib/channel-registry', () => ({
  resolveChannel: jest.fn((channelId: string) => {
    const key = channelId.trim().toLowerCase();
    return key === 'telegram' ? mockAdapter : undefined;
  }),
  listActiveChannels: jest.fn(() => [mockAdapter]),
}));

import { ChannelsService } from './channels.service';

const PROJECT_ID = 'proj_test_1';
const CHANNEL_ROW_ID = 'ch-row-1';
const VALID_TOKEN = '123456789:ABCDEFghijklmnopQRSTUVwxyz';

function buildRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: CHANNEL_ROW_ID,
    projectId: PROJECT_ID,
    channelId: 'telegram',
    enabled: false,
    connectionStatus: ChannelConnectionStatus.DISCONNECTED,
    config: { dmPolicy: 'allowlist', allowFrom: [] },
    lastTestedAt: null,
    lastError: null,
    lastSyncedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    secrets: [] as Array<{
      secretKey: string;
      ciphertext: string;
      updatedAt: Date;
    }>,
    ...overrides,
  };
}

function createService() {
  const prisma = {
    projectChannel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    projectChannelSecret: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ChannelsService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

describe('ChannelsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listDefinitions', () => {
    it('returns catalog entries from active registry', () => {
      const { service } = createService();
      const defs = service.listDefinitions();
      expect(defs).toHaveLength(1);
      expect(defs[0]).toMatchObject({
        id: 'telegram',
        channelId: 'telegram',
        displayName: 'Telegram',
        kind: 'BOT_TOKEN',
      });
    });
  });

  describe('create', () => {
    it('rejects unknown channel', async () => {
      const { service } = createService();
      await expect(
        service.create(PROJECT_ID, { channelId: 'slack' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate channel', async () => {
      const { service, prisma } = createService();
      prisma.projectChannel.findUnique.mockResolvedValue(buildRow());

      await expect(
        service.create(PROJECT_ID, { channelId: 'telegram' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates disconnected row with normalized config', async () => {
      const { service, prisma } = createService();
      const row = buildRow();
      prisma.projectChannel.findUnique.mockResolvedValue(null);
      prisma.projectChannel.create.mockResolvedValue(row);

      const result = await service.create(PROJECT_ID, {
        channelId: 'telegram',
        config: { dmPolicy: 'open' },
      });

      expect(prisma.projectChannel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: PROJECT_ID,
            channelId: 'telegram',
            enabled: false,
            connectionStatus: ChannelConnectionStatus.DISCONNECTED,
            config: expect.objectContaining({ dmPolicy: 'open' }),
          }),
        }),
      );
      expect(result.channelId).toBe('telegram');
      expect(result.connectionStatus).toBe('disconnected');
    });
  });

  describe('getOrCreate', () => {
    it('rejects unknown channel', async () => {
      const { service } = createService();
      await expect(service.getOrCreate(PROJECT_ID, 'unknown')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('upserts channel row', async () => {
      const { service, prisma } = createService();
      const row = buildRow();
      prisma.projectChannel.upsert.mockResolvedValue(row);

      const result = await service.getOrCreate(PROJECT_ID, 'telegram');

      expect(prisma.projectChannel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId_channelId: { projectId: PROJECT_ID, channelId: 'telegram' },
          },
        }),
      );
      expect(result.channelName).toBe('Telegram');
    });
  });

  describe('update', () => {
    it('throws when enabling a disconnected channel', async () => {
      const { service, prisma } = createService();
      prisma.projectChannel.findFirst.mockResolvedValue(buildRow());

      await expect(
        service.update(PROJECT_ID, CHANNEL_ROW_ID, { enabled: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('disables channel and marks disconnected', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow({
        enabled: true,
        connectionStatus: ChannelConnectionStatus.CONNECTED,
      });
      prisma.projectChannel.findFirst.mockResolvedValue(row);
      prisma.projectChannel.update.mockResolvedValue({
        ...row,
        enabled: false,
        connectionStatus: ChannelConnectionStatus.DISCONNECTED,
      });

      const result = await service.update(PROJECT_ID, CHANNEL_ROW_ID, {
        enabled: false,
      });

      expect(prisma.projectChannel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enabled: false,
            connectionStatus: ChannelConnectionStatus.DISCONNECTED,
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(result.enabled).toBe(false);
    });

    it('syncs runtime when config changes', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow();
      prisma.projectChannel.findFirst.mockResolvedValue(row);
      prisma.projectChannel.update.mockResolvedValue({
        ...row,
        config: { dmPolicy: 'open', allowFrom: [] },
      });

      await service.update(PROJECT_ID, CHANNEL_ROW_ID, {
        config: { dmPolicy: 'open' },
      });

      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
      expect(prisma.projectChannel.updateMany).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('throws when channel not found', async () => {
      const { service, prisma } = createService();
      prisma.projectChannel.findFirst.mockResolvedValue(null);

      await expect(service.delete(PROJECT_ID, CHANNEL_ROW_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes row and syncs openclaw config', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectChannel.findFirst.mockResolvedValue(buildRow());

      await service.delete(PROJECT_ID, CHANNEL_ROW_ID);

      expect(prisma.projectChannel.delete).toHaveBeenCalledWith({
        where: { id: CHANNEL_ROW_ID },
      });
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('upsertSecret', () => {
    it('rejects unknown secret key for channel', async () => {
      const { service, prisma } = createService();
      prisma.projectChannel.findFirst.mockResolvedValue(buildRow());

      await expect(
        service.upsertSecret(PROJECT_ID, CHANNEL_ROW_ID, 'api_key', 'value'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('stores encrypted secret and marks configured', async () => {
      const { service, prisma } = createService();
      prisma.projectChannel.findFirst.mockResolvedValue(buildRow());
      prisma.projectChannelSecret.upsert.mockResolvedValue({});
      prisma.projectChannel.update.mockResolvedValue({});

      await service.upsertSecret(
        PROJECT_ID,
        CHANNEL_ROW_ID,
        'bot_token',
        VALID_TOKEN,
      );

      expect(prisma.projectChannelSecret.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            secretKey: 'bot_token',
            ciphertext: `enc:${VALID_TOKEN}`,
          }),
        }),
      );
      expect(prisma.projectChannel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            connectionStatus: ChannelConnectionStatus.CONFIGURED,
            lastError: null,
          }),
        }),
      );
    });
  });

  describe('deleteSecret', () => {
    it('disconnects channel and syncs runtime', async () => {
      const { service, prisma, workspace } = createService();
      prisma.projectChannel.findFirst.mockResolvedValue(
        buildRow({ enabled: true }),
      );
      prisma.projectChannelSecret.deleteMany.mockResolvedValue({ count: 1 });
      prisma.projectChannel.update.mockResolvedValue({});

      await service.deleteSecret(PROJECT_ID, CHANNEL_ROW_ID, 'bot_token');

      expect(prisma.projectChannel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            connectionStatus: ChannelConnectionStatus.DISCONNECTED,
            enabled: false,
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });
  });

  describe('test', () => {
    it('marks connected and syncs on success', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow({
        secrets: [
          {
            secretKey: 'bot_token',
            ciphertext: `enc:${VALID_TOKEN}`,
            updatedAt: new Date(),
          },
        ],
      });
      prisma.projectChannel.findFirst.mockResolvedValue(row);
      testConnectionMock.mockResolvedValue({
        ok: true,
        message: 'Connected as @mybot',
        metadata: { botUsername: 'mybot' },
      });
      prisma.projectChannel.update.mockResolvedValue({
        ...row,
        connectionStatus: ChannelConnectionStatus.CONNECTED,
      });

      const result = await service.test(PROJECT_ID, CHANNEL_ROW_ID);

      expect(testConnectionMock).toHaveBeenCalledWith(
        { bot_token: VALID_TOKEN },
        row.config,
      );
      expect(result.ok).toBe(true);
      expect(prisma.projectChannel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            connectionStatus: ChannelConnectionStatus.CONNECTED,
            config: expect.objectContaining({ botUsername: 'mybot' }),
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('records error status when adapter test fails', async () => {
      const { service, prisma, workspace } = createService();
      const row = buildRow({
        secrets: [
          {
            secretKey: 'bot_token',
            ciphertext: `enc:${VALID_TOKEN}`,
            updatedAt: new Date(),
          },
        ],
      });
      prisma.projectChannel.findFirst.mockResolvedValue(row);
      testConnectionMock.mockResolvedValue({
        ok: false,
        message: 'Unauthorized',
      });
      prisma.projectChannel.update.mockResolvedValue(row);

      const result = await service.test(PROJECT_ID, CHANNEL_ROW_ID);

      expect(result.ok).toBe(false);
      expect(prisma.projectChannel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            connectionStatus: ChannelConnectionStatus.ERROR,
            lastError: 'Unauthorized',
          }),
        }),
      );
      expect(workspace.syncProjectRuntime).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('maps db rows to DTO with masked secrets', async () => {
      const { service, prisma } = createService();
      prisma.projectChannel.findMany.mockResolvedValue([
        buildRow({
          secrets: [
            {
              secretKey: 'bot_token',
              ciphertext: `enc:${VALID_TOKEN}`,
              updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            },
          ],
        }),
      ]);

      const rows = await service.list(PROJECT_ID);

      expect(rows).toHaveLength(1);
      expect(rows[0].secrets[0]).toMatchObject({
        key: 'bot_token',
        masked: expect.stringMatching(/^\*\*\*/),
      });
      expect(rows[0].definition?.description).toBe('Telegram bot');
    });
  });
});
