import { writeFile } from 'node:fs/promises';
import {
  buildInitialOpenClawConfig,
  cleanupStaleMainAgentModels,
  ensureProjectLayout,
  mergeAgentsIntoConfig,
  mergeChannelsIntoConfig,
  mergeConnectorsIntoConfig,
  mergeGatewayBlockIfMissing,
  mergeProviderKeysIntoConfig,
  openClawConfigPath,
  readOpenClawConfigJson,
  removeLegacyDotEnv,
  resolveProjectDataDir,
  type OpenClawProjectConfig,
  writeOpenClawConfigJson,
} from '@aucobot/workspace-sync';
import { decryptSecret } from '@aucobot/control-plane-core';
import { resolveChannel } from '../channels/channel-registry';
import { resolveConnector } from '../connectors/connector-registry';
import { resolveOssGatewayToken } from '../runtime/gateway-endpoint';
import { WorkspaceService } from './workspace.service';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@aucobot/workspace-sync', () => ({
  buildInitialOpenClawConfig: jest.fn((params: { gatewayToken: string }) => ({
    gateway: { mode: 'local', auth: { mode: 'token', token: params.gatewayToken } },
  })),
  cleanupStaleMainAgentModels: jest.fn().mockResolvedValue(undefined),
  ensureProjectLayout: jest.fn().mockResolvedValue('/data/proj_test_1'),
  mergeAgentsIntoConfig: jest.fn(),
  mergeChannelsIntoConfig: jest.fn(),
  mergeConnectorsIntoConfig: jest.fn().mockResolvedValue(undefined),
  mergeGatewayBlockIfMissing: jest.fn(),
  mergeProviderKeysIntoConfig: jest.fn(),
  openClawConfigPath: jest.fn((dataDir: string) => `${dataDir}/openclaw.json`),
  readOpenClawConfigJson: jest.fn(),
  removeLegacyDotEnv: jest.fn().mockResolvedValue(undefined),
  resolveProjectDataDir: jest.fn((projectId: string) => `/data/${projectId}`),
  parseAgentFormData: jest.fn((formData: unknown) => formData),
  writeOpenClawConfigJson: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@aucobot/control-plane-core', () => ({
  decryptSecret: jest.fn((ciphertext: string) => ciphertext.replace(/^enc:/, '')),
}));

jest.mock('../connectors/connector-registry', () => ({
  resolveConnector: jest.fn(),
}));

jest.mock('../channels/channel-registry', () => ({
  resolveChannel: jest.fn(),
}));

jest.mock('../runtime/gateway-endpoint', () => ({
  resolveOssGatewayToken: jest.fn(() => 'resolved-oss-token'),
}));

const PROJECT_ID = 'proj_test_1';
const DATA_DIR = '/data/proj_test_1';
const CONFIG_PATH = `${DATA_DIR}/openclaw.json`;

const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;
const ensureProjectLayoutMock = ensureProjectLayout as jest.MockedFunction<
  typeof ensureProjectLayout
>;
const resolveProjectDataDirMock = resolveProjectDataDir as jest.MockedFunction<
  typeof resolveProjectDataDir
>;
const buildInitialOpenClawConfigMock = buildInitialOpenClawConfig as jest.MockedFunction<
  typeof buildInitialOpenClawConfig
>;
const readOpenClawConfigJsonMock = readOpenClawConfigJson as jest.MockedFunction<
  typeof readOpenClawConfigJson
>;
const mergeGatewayBlockIfMissingMock = mergeGatewayBlockIfMissing as jest.MockedFunction<
  typeof mergeGatewayBlockIfMissing
>;
const mergeProviderKeysIntoConfigMock = mergeProviderKeysIntoConfig as jest.MockedFunction<
  typeof mergeProviderKeysIntoConfig
>;
const mergeAgentsIntoConfigMock = mergeAgentsIntoConfig as jest.MockedFunction<
  typeof mergeAgentsIntoConfig
>;
const mergeConnectorsIntoConfigMock = mergeConnectorsIntoConfig as jest.MockedFunction<
  typeof mergeConnectorsIntoConfig
>;
const mergeChannelsIntoConfigMock = mergeChannelsIntoConfig as jest.MockedFunction<
  typeof mergeChannelsIntoConfig
>;
const cleanupStaleMainAgentModelsMock = cleanupStaleMainAgentModels as jest.MockedFunction<
  typeof cleanupStaleMainAgentModels
>;
const writeOpenClawConfigJsonMock = writeOpenClawConfigJson as jest.MockedFunction<
  typeof writeOpenClawConfigJson
>;
const removeLegacyDotEnvMock = removeLegacyDotEnv as jest.MockedFunction<
  typeof removeLegacyDotEnv
>;
const resolveOssGatewayTokenMock = resolveOssGatewayToken as jest.MockedFunction<
  typeof resolveOssGatewayToken
>;
const resolveConnectorMock = resolveConnector as jest.MockedFunction<typeof resolveConnector>;
const resolveChannelMock = resolveChannel as jest.MockedFunction<typeof resolveChannel>;

function createService() {
  const prisma = {
    project: { findUnique: jest.fn() },
    projectProviderKey: { findMany: jest.fn() },
    projectAgent: { findMany: jest.fn() },
    projectConnector: { findMany: jest.fn() },
    projectChannel: { findMany: jest.fn() },
  };
  const service = new WorkspaceService(prisma as never);
  return { service, prisma };
}

describe('WorkspaceService', () => {
  const originalDataRoot = process.env.OPENCLAW_DATA_ROOT;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENCLAW_DATA_ROOT = '/tmp/openclaw-test';
    ensureProjectLayoutMock.mockResolvedValue(DATA_DIR);
    resolveProjectDataDirMock.mockImplementation((id) => `/data/${id}`);
  });

  afterAll(() => {
    if (originalDataRoot === undefined) {
      delete process.env.OPENCLAW_DATA_ROOT;
    } else {
      process.env.OPENCLAW_DATA_ROOT = originalDataRoot;
    }
  });

  describe('resolveProjectDataDir', () => {
    it('delegates to workspace-sync with OPENCLAW_DATA_ROOT', () => {
      const { service } = createService();
      const dir = service.resolveProjectDataDir(PROJECT_ID);
      expect(dir).toBe(`/data/${PROJECT_ID}`);
      expect(resolveProjectDataDirMock).toHaveBeenCalledWith(PROJECT_ID, {
        dataRoot: '/tmp/openclaw-test',
      });
    });
  });

  describe('ensureProjectLayout', () => {
    it('creates project folder on disk', async () => {
      const { service } = createService();
      const dir = await service.ensureProjectLayout(PROJECT_ID);
      expect(dir).toBe(DATA_DIR);
      expect(ensureProjectLayoutMock).toHaveBeenCalledWith(PROJECT_ID, {
        dataRoot: '/tmp/openclaw-test',
      });
    });
  });

  describe('syncOpenClawJsonToDisk', () => {
    it('writes pretty-printed openclaw.json', async () => {
      const { service } = createService();
      const config = buildInitialOpenClawConfigMock({ gatewayToken: 'test' });

      await service.syncOpenClawJsonToDisk(PROJECT_ID, config);

      expect(ensureProjectLayoutMock).toHaveBeenCalledWith(PROJECT_ID, {
        dataRoot: '/tmp/openclaw-test',
      });
      expect(writeFileMock).toHaveBeenCalledWith(
        CONFIG_PATH,
        `${JSON.stringify(config, null, 2)}\n`,
        'utf8',
      );
    });
  });

  describe('bootstrapProjectWorkspace', () => {
    it('builds initial config and returns dataDir', async () => {
      const { service } = createService();

      const result = await service.bootstrapProjectWorkspace({
        projectId: PROJECT_ID,
        gatewayToken: 'gw-token-abc',
      });

      expect(buildInitialOpenClawConfigMock).toHaveBeenCalledWith({
        gatewayToken: 'gw-token-abc',
      });
      expect(writeFileMock).toHaveBeenCalled();
      expect(result).toEqual({ dataDir: DATA_DIR });
    });
  });

  describe('ensureGatewayConfigOnDisk', () => {
    it('writes initial config when openclaw.json is missing', async () => {
      const { service } = createService();
      readOpenClawConfigJsonMock.mockResolvedValue(null);

      await service.ensureGatewayConfigOnDisk(PROJECT_ID, 'new-token');

      expect(buildInitialOpenClawConfigMock).toHaveBeenCalledWith({
        gatewayToken: 'new-token',
      });
      expect(writeFileMock).toHaveBeenCalled();
    });

    it('keeps existing config when gateway token auth is already set', async () => {
      const { service } = createService();
      readOpenClawConfigJsonMock.mockResolvedValue({
        gateway: {
          mode: 'local',
          auth: { mode: 'token', token: 'existing-token' },
        },
      });
      writeFileMock.mockClear();

      await service.ensureGatewayConfigOnDisk(PROJECT_ID, 'new-token');

      expect(buildInitialOpenClawConfigMock).not.toHaveBeenCalled();
      expect(writeFileMock).not.toHaveBeenCalled();
    });

    it('rewrites config when gateway block has no mode', async () => {
      const { service } = createService();
      readOpenClawConfigJsonMock.mockResolvedValue({
        gateway: { auth: { mode: 'token', token: 'x' } },
      });
      writeFileMock.mockClear();

      await service.ensureGatewayConfigOnDisk(PROJECT_ID, 'replace-token');

      expect(buildInitialOpenClawConfigMock).toHaveBeenCalledWith({
        gatewayToken: 'replace-token',
      });
      expect(writeFileMock).toHaveBeenCalled();
    });
  });

  describe('syncProjectRuntime', () => {
    it('merges DB state into openclaw.json and cleans up legacy files', async () => {
      const { service, prisma } = createService();
      const config: Record<string, unknown> = {};

      readOpenClawConfigJsonMock.mockResolvedValue(config);
      prisma.project.findUnique.mockResolvedValue({ gatewayToken: 'db-token' });
      prisma.projectProviderKey.findMany.mockResolvedValue([
        { providerId: 'gemini', enabled: true, ciphertext: 'enc:key' },
      ]);
      prisma.projectAgent.findMany.mockResolvedValue([
        {
          slug: 'main',
          name: 'Main',
          formData: { model: 'google/gemini-2.5-flash' },
          isDefault: true,
        },
      ]);
      prisma.projectConnector.findMany.mockResolvedValue([
        {
          connectorSlug: 'github',
          enabled: true,
          connectionStatus: 'CONNECTED',
          secrets: [{ secretKey: 'token', ciphertext: 'enc:gh' }],
        },
      ]);
      prisma.projectChannel.findMany.mockResolvedValue([
        {
          channelId: 'telegram',
          enabled: true,
          connectionStatus: 'CONNECTED',
          config: {},
          secrets: [{ secretKey: 'botToken', ciphertext: 'enc:tg' }],
        },
      ]);
      resolveConnectorMock.mockReturnValue({
        slug: 'github',
        mcpServerId: 'github-mcp',
      } as never);
      resolveChannelMock.mockReturnValue({
        pluginId: 'telegram',
        buildOpenClawConfig: jest.fn(() => ({ channels: { telegram: {} } })),
      } as never);

      await service.syncProjectRuntime(PROJECT_ID);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        select: { gatewayToken: true },
      });
      expect(resolveOssGatewayTokenMock).toHaveBeenCalledWith('db-token');
      expect(mergeGatewayBlockIfMissingMock).toHaveBeenCalledWith(
        config,
        'resolved-oss-token',
      );
      expect(mergeProviderKeysIntoConfigMock).toHaveBeenCalledWith(
        config,
        [{ providerId: 'gemini', enabled: true, ciphertext: 'enc:key' }],
        decryptSecret,
      );
      expect(mergeAgentsIntoConfigMock).toHaveBeenCalled();
      expect(mergeConnectorsIntoConfigMock).toHaveBeenCalledWith(
        config,
        expect.arrayContaining([
          expect.objectContaining({
            connectorSlug: 'github',
            mcpServerId: 'github-mcp',
            secrets: { token: 'gh' },
          }),
        ]),
        DATA_DIR,
        expect.any(Function),
      );
      expect(mergeChannelsIntoConfigMock).toHaveBeenCalled();
      expect(cleanupStaleMainAgentModelsMock).toHaveBeenCalledWith(DATA_DIR, config);
      expect(writeOpenClawConfigJsonMock).toHaveBeenCalledWith(CONFIG_PATH, config);
      expect(removeLegacyDotEnvMock).toHaveBeenCalledWith(DATA_DIR);
    });

    it('skips invalid connector secrets without failing sync', async () => {
      const { service, prisma } = createService();
      const config: Record<string, unknown> = {};

      readOpenClawConfigJsonMock.mockResolvedValue(config);
      prisma.project.findUnique.mockResolvedValue({ gatewayToken: null });
      prisma.projectProviderKey.findMany.mockResolvedValue([]);
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectConnector.findMany.mockResolvedValue([
        {
          connectorSlug: 'bad',
          enabled: true,
          connectionStatus: 'CONNECTED',
          secrets: [{ secretKey: 'token', ciphertext: 'not-enc-prefix' }],
        },
      ]);
      prisma.projectChannel.findMany.mockResolvedValue([]);
      resolveConnectorMock.mockReturnValue(undefined);

      const decryptMock = decryptSecret as jest.MockedFunction<typeof decryptSecret>;
      decryptMock.mockImplementationOnce(() => {
        throw new Error('decrypt failed');
      });

      await expect(service.syncProjectRuntime(PROJECT_ID)).resolves.toBeUndefined();

      expect(mergeConnectorsIntoConfigMock).toHaveBeenCalledWith(
        config,
        [expect.objectContaining({ connectorSlug: 'bad', secrets: {} })],
        DATA_DIR,
        expect.any(Function),
      );
    });

    it('uses empty config object when openclaw.json does not exist yet', async () => {
      const { service, prisma } = createService();

      readOpenClawConfigJsonMock.mockResolvedValue(null);
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.projectProviderKey.findMany.mockResolvedValue([]);
      prisma.projectAgent.findMany.mockResolvedValue([]);
      prisma.projectConnector.findMany.mockResolvedValue([]);
      prisma.projectChannel.findMany.mockResolvedValue([]);

      await service.syncProjectRuntime(PROJECT_ID);

      expect(mergeGatewayBlockIfMissingMock).toHaveBeenCalledWith({}, 'resolved-oss-token');
      expect(writeOpenClawConfigJsonMock).toHaveBeenCalledWith(CONFIG_PATH, {});
    });
  });
});
