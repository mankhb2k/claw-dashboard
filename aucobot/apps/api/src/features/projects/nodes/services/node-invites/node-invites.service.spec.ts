import {
  BadRequestException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('../../../services/projects/projects.service', () => ({
  ProjectsService: class MockProjectsService {},
}));

jest.mock('../../../runtime/gateway-endpoint', () => ({
  resolveOssGatewayHttpBase: jest.fn(() => 'http://127.0.0.1:18789'),
  resolveOssGatewayToken: jest.fn(
    (token?: string | null) => token ?? 'env-gateway-token',
  ),
  resolveGatewayEndpoint: jest.fn(() => ({
    baseUrl: 'http://127.0.0.1:18789',
    wsBaseUrl: 'ws://127.0.0.1:18789',
    token: 'resolved-token',
  })),
}));

import { NodeInvitesService } from './node-invites.service';
import {
  hashNodeInviteCode,
  NODE_INVITE_PREFIX,
} from '../../lib/node-invite.util';

const USER_ID = 'user_test_1';
const PROJECT_ID = 'proj_test_1';
const INVITE_ID = 'invite_1';

function createService() {
  const prisma = {
    nodeInvite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  };
  const projects = {
    assertOwned: jest.fn().mockResolvedValue(undefined),
  };
  const service = new NodeInvitesService(prisma as never, projects as never);
  return { service, prisma, projects };
}

function buildInviteRow(
  overrides: Partial<{
    id: string;
    codePrefix: string;
    label: string | null;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: INVITE_ID,
    codePrefix: `${NODE_INVITE_PREFIX}abcd`,
    label: null,
    expiresAt: new Date(Date.now() + 15 * 60_000),
    usedAt: null,
    createdAt: new Date('2026-06-01T10:00:00.000Z'),
    ...overrides,
  };
}

describe('NodeInvitesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.FRONTEND_URL;
  });

  describe('createInvite', () => {
    it('rejects ttlMinutes below minimum', async () => {
      const { service, prisma } = createService();

      await expect(
        service.createInvite(USER_ID, PROJECT_ID, { ttlMinutes: 4 }),
      ).rejects.toThrow(
        new BadRequestException('ttlMinutes must be between 5 and 60'),
      );
      expect(prisma.nodeInvite.create).not.toHaveBeenCalled();
    });

    it('rejects ttlMinutes above maximum', async () => {
      const { service, prisma } = createService();

      await expect(
        service.createInvite(USER_ID, PROJECT_ID, { ttlMinutes: 61 }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.nodeInvite.create).not.toHaveBeenCalled();
    });

    it('creates invite with default ttl and returns plaintext code once', async () => {
      const { service, prisma, projects } = createService();
      const row = buildInviteRow({ label: 'Phone' });
      prisma.nodeInvite.create.mockResolvedValue(row);

      const result = await service.createInvite(USER_ID, PROJECT_ID, {
        label: '  Phone  ',
      });

      expect(projects.assertOwned).toHaveBeenCalledWith(USER_ID, PROJECT_ID);
      expect(prisma.nodeInvite.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: PROJECT_ID,
            label: 'Phone',
          }),
        }),
      );
      expect(result.code.startsWith(NODE_INVITE_PREFIX)).toBe(true);
      expect(result.invite.status).toBe('active');
      expect(result.invite.label).toBe('Phone');
    });
  });

  describe('listInvites', () => {
    it('maps active, used, and expired statuses', async () => {
      const { service, prisma } = createService();
      prisma.nodeInvite.findMany.mockResolvedValue([
        buildInviteRow({ id: 'active-1' }),
        buildInviteRow({
          id: 'used-1',
          usedAt: new Date('2026-06-01T11:00:00.000Z'),
        }),
        buildInviteRow({
          id: 'expired-1',
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      ]);

      const items = await service.listInvites(USER_ID, PROJECT_ID);

      expect(items.map((item) => item.status)).toEqual([
        'active',
        'used',
        'expired',
      ]);
    });
  });

  describe('revokeInvite', () => {
    it('throws NotFoundException when invite is missing', async () => {
      const { service, prisma } = createService();
      prisma.nodeInvite.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeInvite(USER_ID, PROJECT_ID, INVITE_ID),
      ).rejects.toThrow(new NotFoundException('Invite not found'));
      expect(prisma.nodeInvite.delete).not.toHaveBeenCalled();
    });

    it('deletes invite when found', async () => {
      const { service, prisma } = createService();
      prisma.nodeInvite.findFirst.mockResolvedValue(buildInviteRow());
      prisma.nodeInvite.delete.mockResolvedValue({});

      await service.revokeInvite(USER_ID, PROJECT_ID, INVITE_ID);

      expect(prisma.nodeInvite.delete).toHaveBeenCalledWith({
        where: { id: INVITE_ID },
      });
    });
  });

  describe('redeemInvite', () => {
    const validCode = `${NODE_INVITE_PREFIX}abcdefghij`;

    it('rejects codes shorter than 12 characters', async () => {
      const { service, prisma } = createService();

      await expect(service.redeemInvite('short')).rejects.toThrow(
        new BadRequestException('Invalid invite code'),
      );
      expect(prisma.nodeInvite.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when code hash is unknown', async () => {
      const { service, prisma } = createService();
      prisma.nodeInvite.findUnique.mockResolvedValue(null);

      await expect(service.redeemInvite(validCode)).rejects.toThrow(
        new NotFoundException('Invite not found'),
      );
      expect(prisma.nodeInvite.findUnique).toHaveBeenCalledWith({
        where: { codeHash: hashNodeInviteCode(validCode) },
        include: { project: true },
      });
    });

    it('throws GoneException when invite was already used', async () => {
      const { service, prisma } = createService();
      prisma.nodeInvite.findUnique.mockResolvedValue({
        ...buildInviteRow(),
        codeHash: hashNodeInviteCode(validCode),
        usedAt: new Date('2026-06-01T12:00:00.000Z'),
        project: { id: PROJECT_ID, gatewayToken: 'gw-token' },
      });

      await expect(service.redeemInvite(validCode)).rejects.toThrow(
        new GoneException('Invite already used'),
      );
      expect(prisma.nodeInvite.update).not.toHaveBeenCalled();
    });

    it('throws GoneException when invite is expired', async () => {
      const { service, prisma } = createService();
      prisma.nodeInvite.findUnique.mockResolvedValue({
        ...buildInviteRow({
          expiresAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
        codeHash: hashNodeInviteCode(validCode),
        project: { id: PROJECT_ID, gatewayToken: 'gw-token' },
      });

      await expect(service.redeemInvite(validCode)).rejects.toThrow(
        new GoneException('Invite expired'),
      );
      expect(prisma.nodeInvite.update).not.toHaveBeenCalled();
    });

    it('marks invite used and returns gateway credentials', async () => {
      const { service, prisma } = createService();
      process.env.FRONTEND_URL = 'https://app.example.com/';
      prisma.nodeInvite.findUnique.mockResolvedValue({
        ...buildInviteRow(),
        codeHash: hashNodeInviteCode(validCode),
        project: { id: PROJECT_ID, gatewayToken: 'gw-token' },
      });
      prisma.nodeInvite.update.mockResolvedValue({});

      const result = await service.redeemInvite(`  ${validCode}  `);

      expect(prisma.nodeInvite.update).toHaveBeenCalledWith({
        where: { id: INVITE_ID },
        data: { usedAt: expect.any(Date) },
      });
      expect(result).toEqual({
        gatewayUrl: 'http://127.0.0.1:18789',
        gatewayToken: 'gw-token',
        aucobotWebUrl: 'https://app.example.com',
        projectId: PROJECT_ID,
      });
    });
  });
});
