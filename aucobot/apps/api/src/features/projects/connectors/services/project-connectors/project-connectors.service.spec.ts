import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConnectorConnectionStatus } from '@aucobot/database';

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
  id: 'google-drive',
  slug: 'google-drive',
  displayName: 'Google Drive',
  description: 'Drive MCP',
  kind: 'OAUTH' as const,
  status: 'ACTIVE' as const,
  oauthScopes: ['https://www.googleapis.com/auth/drive.readonly'],
  mcpServerId: 'google-drive',
  configSchema: null,
  testConnection: testConnectionMock,
  isOAuthConfigured: jest.fn().mockReturnValue(true),
  buildOAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/auth'),
  exchangeOAuthCode: jest.fn(),
  oauthClientSecrets: jest.fn().mockReturnValue({ clientId: 'cid', clientSecret: 'csec' }),
};

jest.mock('../../lib/connector-registry', () => ({
  resolveConnector: jest.fn((slug: string) => {
    const key = slug.trim().toLowerCase();
    return key === 'google-drive' ? mockAdapter : undefined;
  }),
  listActiveConnectors: jest.fn(() => [mockAdapter]),
}));

import { ProjectConnectorsService } from './project-connectors.service';

const PROJECT_ID = 'proj_test_1';
const CONNECTOR_ID = 'conn-row-1';

function createService() {
  const prisma = {
    projectConnector: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    projectConnectorSecret: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const workspace = {
    syncProjectRuntime: jest.fn().mockResolvedValue(undefined),
  };
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('signed-state'),
    verifyAsync: jest.fn(),
  };
  const service = new ProjectConnectorsService(
    prisma as never,
    workspace as never,
    jwt as never,
  );
  return { service, prisma, workspace, jwt };
}

describe('ProjectConnectorsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testConnectionMock.mockReset();
    mockAdapter.isOAuthConfigured.mockReturnValue(true);
  });

  describe('create', () => {
    it('rejects unknown connector slug', async () => {
      const { service } = createService();
      await expect(
        service.create(PROJECT_ID, { connectorSlug: 'unknown' }),
      ).rejects.toThrow(new BadRequestException('Unknown connector: unknown'));
    });

    it('rejects duplicate connector for project', async () => {
      const { service, prisma } = createService();
      prisma.projectConnector.findUnique.mockResolvedValue({ id: CONNECTOR_ID });

      await expect(
        service.create(PROJECT_ID, { connectorSlug: 'google-drive' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('test', () => {
    it('returns error when refresh token is missing', async () => {
      const { service, prisma } = createService();
      prisma.projectConnector.findFirst.mockResolvedValue({
        id: CONNECTOR_ID,
        projectId: PROJECT_ID,
        connectorSlug: 'google-drive',
        secrets: [],
      });
      prisma.projectConnector.update.mockResolvedValue({});

      const result = await service.test(PROJECT_ID, CONNECTOR_ID);

      expect(result).toEqual({ ok: false, message: 'Chưa có refresh token' });
      expect(testConnectionMock).not.toHaveBeenCalled();
    });

    it('delegates to adapter testConnection when refresh token exists', async () => {
      const { service, prisma } = createService();
      prisma.projectConnector.findFirst.mockResolvedValue({
        id: CONNECTOR_ID,
        projectId: PROJECT_ID,
        connectorSlug: 'google-drive',
        secrets: [
          {
            secretKey: 'refresh_token',
            ciphertext: 'enc:refresh-abc',
          },
        ],
      });
      prisma.projectConnector.update.mockResolvedValue({});
      testConnectionMock.mockResolvedValue({ ok: true, message: 'Kết nối Google OK' });

      const result = await service.test(PROJECT_ID, CONNECTOR_ID);

      expect(testConnectionMock).toHaveBeenCalledWith({ refresh_token: 'refresh-abc' });
      expect(result).toEqual({ ok: true, message: 'Kết nối Google OK' });
    });
  });

  describe('startOAuth', () => {
    it('rejects when OAuth is not configured on server', async () => {
      const { service } = createService();
      mockAdapter.isOAuthConfigured.mockReturnValue(false);

      await expect(
        service.startOAuth('user-1', PROJECT_ID, 'google-drive'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns auth url when configured', async () => {
      const { service, prisma } = createService();
      prisma.projectConnector.findUnique.mockResolvedValue(null);
      prisma.projectConnector.create.mockResolvedValue({
        id: CONNECTOR_ID,
        connectorSlug: 'google-drive',
      });

      const result = await service.startOAuth('user-1', PROJECT_ID, 'google-drive');

      expect(result.url).toBe('https://accounts.google.com/o/oauth2/auth');
      expect(mockAdapter.buildOAuthUrl).toHaveBeenCalledWith({
        state: 'signed-state',
        prompt: 'consent',
      });
    });
  });
});
