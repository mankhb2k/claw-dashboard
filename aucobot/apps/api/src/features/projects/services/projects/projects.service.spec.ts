import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus } from '@aucobot/database';

jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abc123xyz0',
}));

const provisionMock = jest.fn();
const getStatusMock = jest.fn().mockResolvedValue('running');

jest.mock('../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('../../runtime/runtime-mode', () => ({
  isOssRuntime: jest.fn(() => true),
}));

jest.mock('@aucobot/control-plane-core', () => ({
  gatewayTokenForNewProject: jest.fn(() => 'gw-token-new'),
}));

jest.mock('@aucobot/runtime-oss', () => ({
  StaticGatewayProvisioner: jest.fn().mockImplementation(() => ({
    provision: provisionMock,
    getStatus: getStatusMock,
  })),
}));

const resolveGatewayEndpointMock = jest.fn();
const resolveOssGatewayTokenMock = jest.fn();

jest.mock('../../runtime/gateway-endpoint', () => ({
  resolveGatewayEndpoint: (...args: unknown[]) => resolveGatewayEndpointMock(...args),
  resolveOssGatewayToken: (...args: unknown[]) => resolveOssGatewayTokenMock(...args),
  resolveOssGatewayHttpBase: jest.fn(() => 'http://127.0.0.1:18789'),
}));

import { isOssRuntime } from '../../runtime/runtime-mode';
import { gatewayTokenForNewProject } from '@aucobot/control-plane-core';
import { ProjectsService } from './projects.service';

const isOssRuntimeMock = isOssRuntime as jest.MockedFunction<typeof isOssRuntime>;
const gatewayTokenForNewProjectMock = gatewayTokenForNewProject as jest.MockedFunction<
  typeof gatewayTokenForNewProject
>;

const USER_ID = 'user-1';
const PROJECT_ID = 'proj-1';

function buildProject(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PROJECT_ID,
    userId: USER_ID,
    displayName: 'My workspace',
    subdomain: 'p-abc123xyz0',
    status: ProjectStatus.RUNNING,
    gatewayToken: 'gw-token-new',
    containerId: null,
    hostPort: null,
    errorMessage: null,
    lastActiveAt: new Date('2026-01-02T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const workspace = {
    bootstrapProjectWorkspace: jest.fn().mockResolvedValue(undefined),
    syncGatewayAuthToDisk: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ProjectsService(prisma as never, workspace as never);
  return { service, prisma, workspace };
}

describe('ProjectsService', () => {
  const originalEnvToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    getStatusMock.mockResolvedValue('running');
    isOssRuntimeMock.mockReturnValue(true);
    gatewayTokenForNewProjectMock.mockReturnValue('gw-token-new');
    provisionMock.mockImplementation(
      async (
        projectId: string,
        opts: { gatewayToken: string; onBootstrap?: (id: string, token: string) => Promise<void> },
      ) => {
        await opts.onBootstrap?.(projectId, opts.gatewayToken);
        return { projectId, mode: 'oss' };
      },
    );
    resolveOssGatewayTokenMock.mockImplementation(
      (token?: string | null) => token ?? 'env-fallback-token',
    );
    resolveGatewayEndpointMock.mockReturnValue({
      baseUrl: 'http://127.0.0.1:18789',
      wsBaseUrl: 'ws://127.0.0.1:18789',
      token: 'resolved-token',
    });
    delete process.env.OPENCLAW_GATEWAY_TOKEN;
  });

  afterAll(() => {
    if (originalEnvToken === undefined) {
      delete process.env.OPENCLAW_GATEWAY_TOKEN;
    } else {
      process.env.OPENCLAW_GATEWAY_TOKEN = originalEnvToken;
    }
  });

  describe('listMine', () => {
    it('returns projects for user ordered by createdAt desc', async () => {
      const { service, prisma } = createService();
      prisma.project.findMany.mockResolvedValue([buildProject()]);

      const rows = await service.listMine(USER_ID);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: PROJECT_ID,
        displayName: 'My workspace',
        status: 'running',
      });
    });
  });

  describe('create', () => {
    it('rejects when runtime is not OSS', async () => {
      isOssRuntimeMock.mockReturnValue(false);
      const { service } = createService();

      await expect(
        service.create(USER_ID, { displayName: 'New' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when user already has a project', async () => {
      const { service, prisma } = createService();
      prisma.user.findUnique.mockResolvedValue({ id: USER_ID, name: 'Admin', username: 'admin' });
      prisma.project.findUnique.mockResolvedValue(buildProject());

      await expect(
        service.create(USER_ID, { displayName: 'New' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('provisions OSS gateway and marks project RUNNING', async () => {
      const { service, prisma, workspace } = createService();
      const creating = buildProject({ status: ProjectStatus.CREATING, gatewayToken: null });
      const running = buildProject({ status: ProjectStatus.RUNNING });

      prisma.user.findUnique.mockResolvedValue({ id: USER_ID, name: 'Admin', username: 'admin' });
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue(creating);
      prisma.project.update.mockResolvedValue(running);

      const dto = await service.create(USER_ID, { displayName: '  My Bot  ' });

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_ID,
            displayName: 'My Bot',
            status: ProjectStatus.CREATING,
            subdomain: expect.stringMatching(/^p-[a-z0-9]{10}$/),
          }),
        }),
      );
      expect(provisionMock).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({ gatewayToken: 'gw-token-new' }),
      );
      expect(workspace.bootstrapProjectWorkspace).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        gatewayToken: 'gw-token-new',
      });
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ProjectStatus.RUNNING,
            gatewayToken: 'gw-token-new',
            errorMessage: null,
          }),
        }),
      );
      expect(dto.status).toBe('running');
    });

    it('defaults displayName from user when omitted', async () => {
      const { service, prisma } = createService();
      const creating = buildProject({
        status: ProjectStatus.CREATING,
        gatewayToken: null,
        displayName: 'Alice',
      });
      const running = buildProject({ displayName: 'Alice' });

      prisma.user.findUnique.mockResolvedValue({
        id: USER_ID,
        name: 'Alice',
        username: 'alice',
      });
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue(creating);
      prisma.project.update.mockResolvedValue(running);

      await service.create(USER_ID, {});

      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ displayName: 'Alice' }),
        }),
      );
    });

    it('marks project ERROR and throws when provision fails', async () => {
      const { service, prisma } = createService();
      const creating = buildProject({ status: ProjectStatus.CREATING });

      prisma.user.findUnique.mockResolvedValue({ id: USER_ID, name: null, username: 'admin' });
      prisma.project.findUnique.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue(creating);
      provisionMock.mockRejectedValue(new Error('gateway unhealthy'));

      await expect(
        service.create(USER_ID, { displayName: 'Fail' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        data: {
          status: ProjectStatus.ERROR,
          errorMessage: 'gateway unhealthy',
        },
      });
    });
  });

  describe('runtime lifecycle actions', () => {
    it('respawn throws OSS message in OSS mode', async () => {
      const { service } = createService();

      await expect(service.respawn(USER_ID, PROJECT_ID)).rejects.toMatchObject({
        response: expect.objectContaining({
          message: expect.stringContaining('shared gateway'),
        }),
      });
    });

    it('start throws OSS message in OSS mode', async () => {
      const { service } = createService();

      await expect(service.start(USER_ID, PROJECT_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('stop throws OSS message in OSS mode', async () => {
      const { service } = createService();

      await expect(service.stop(USER_ID, PROJECT_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('health', () => {
    it('throws when project not owned', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(service.health(USER_ID, PROJECT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns health summary for owned project', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(buildProject());

      const health = await service.health(USER_ID, PROJECT_ID);

      expect(getStatusMock).toHaveBeenCalled();
      expect(health).toMatchObject({
        status: 'running',
        displayName: 'My workspace',
        subdomain: 'p-abc123xyz0',
        containerMissing: false,
      });
      expect(health.publicUrl).toBe('http://127.0.0.1:18789');
    });

    it('syncs CREATING to RUNNING when shared gateway is healthy', async () => {
      const { service, prisma } = createService();
      const creating = buildProject({ status: ProjectStatus.CREATING });
      const running = buildProject({ status: ProjectStatus.RUNNING });
      prisma.project.findFirst.mockResolvedValue(creating);
      prisma.project.update.mockResolvedValue(running);
      getStatusMock.mockResolvedValue('running');

      const health = await service.health(USER_ID, PROJECT_ID);

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ProjectStatus.RUNNING }),
        }),
      );
      expect(health.status).toBe('running');
    });

    it('marks RUNNING as ERROR when gateway is down', async () => {
      const { service, prisma } = createService();
      const running = buildProject({ status: ProjectStatus.RUNNING });
      const errored = buildProject({
        status: ProjectStatus.ERROR,
        errorMessage: 'Gateway is not reachable on port 18789. Run Openclaw and match OPENCLAW_GATEWAY_TOKEN in aucobot/.env.',
      });
      prisma.project.findFirst.mockResolvedValue(running);
      prisma.project.update.mockResolvedValue(errored);
      getStatusMock.mockResolvedValue('error');

      const health = await service.health(USER_ID, PROJECT_ID);

      expect(prisma.project.update).toHaveBeenCalled();
      expect(health.status).toBe('error');
    });
  });

  describe('assertOwned', () => {
    it('returns project row when owned', async () => {
      const { service, prisma } = createService();
      const row = buildProject();
      prisma.project.findFirst.mockResolvedValue(row);

      await expect(service.assertOwned(USER_ID, PROJECT_ID)).resolves.toBe(row);
    });
  });

  describe('getGatewayToken', () => {
    it('resolves OSS gateway token for project', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(buildProject());

      const result = await service.getGatewayToken(USER_ID, PROJECT_ID);

      expect(resolveOssGatewayTokenMock).toHaveBeenCalledWith('gw-token-new');
      expect(result).toEqual({ token: 'gw-token-new' });
    });
  });

  describe('getRuntimeForChat', () => {
    it('returns PROJECT_NOT_RUNNING when status is not RUNNING', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(
        buildProject({ status: ProjectStatus.CREATING }),
      );

      const runtime = await service.getRuntimeForChat(USER_ID, PROJECT_ID);

      expect(runtime.ready).toBe(false);
      expect(runtime).toMatchObject({ reason: 'PROJECT_NOT_RUNNING' });
    });

    it('returns GATEWAY_NOT_CONFIGURED when no project or env token', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(
        buildProject({ gatewayToken: null }),
      );

      const runtime = await service.getRuntimeForChat(USER_ID, PROJECT_ID);

      expect(runtime.ready).toBe(false);
      expect(runtime).toMatchObject({ reason: 'GATEWAY_NOT_CONFIGURED' });
    });

    it('returns ready endpoint when gateway resolves', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(buildProject());

      const runtime = await service.getRuntimeForChat(USER_ID, PROJECT_ID);

      expect(runtime.ready).toBe(true);
      if (runtime.ready) {
        expect(runtime.gatewayWsUrl).toBe('ws://127.0.0.1:18789');
        expect(runtime.gatewayToken).toBe('resolved-token');
      }
      expect(resolveGatewayEndpointMock).toHaveBeenCalled();
    });

    it('returns GATEWAY_NOT_CONFIGURED when endpoint resolution throws', async () => {
      const { service, prisma } = createService();
      prisma.project.findFirst.mockResolvedValue(buildProject());
      resolveGatewayEndpointMock.mockImplementation(() => {
        throw new Error('bad config');
      });

      const runtime = await service.getRuntimeForChat(USER_ID, PROJECT_ID);

      expect(runtime.ready).toBe(false);
      expect(runtime).toMatchObject({ reason: 'GATEWAY_NOT_CONFIGURED' });
    });

    it('uses env OPENCLAW_GATEWAY_TOKEN when project token is null', async () => {
      const { service, prisma } = createService();
      process.env.OPENCLAW_GATEWAY_TOKEN = '  env-only-token  ';
      prisma.project.findFirst.mockResolvedValue(
        buildProject({ gatewayToken: null }),
      );

      const runtime = await service.getRuntimeForChat(USER_ID, PROJECT_ID);

      expect(runtime.ready).toBe(true);
    });
  });
});
