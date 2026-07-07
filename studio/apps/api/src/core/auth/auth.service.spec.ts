import { UnauthorizedException } from '@nestjs/common';

const verifyAccessTokenMock = jest.fn();
const extractAccessTokenFromRequestMock = jest.fn();
const extractRefreshTokenFromRequestMock = jest.fn();
const accessMaxAgeSecMock = jest.fn(() => 900);
const hashRefreshTokenMock = jest.fn((raw: string) => `hash:${raw}`);
const signAccessTokenMock = jest.fn(() => 'access-jwt');
const generateRefreshTokenRawMock = jest.fn(() => 'refresh-raw-new');

jest.mock('@claw-dashboard/control-plane-core', () => ({
  verifyAccessToken: (...args: unknown[]) => verifyAccessTokenMock(...args),
  extractAccessTokenFromRequest: (...args: unknown[]) =>
    extractAccessTokenFromRequestMock(...args),
  extractRefreshTokenFromRequest: (...args: unknown[]) =>
    extractRefreshTokenFromRequestMock(...args),
  accessMaxAgeSec: () => accessMaxAgeSecMock(),
  hashRefreshToken: (raw: string) => hashRefreshTokenMock(raw),
  signAccessToken: () => signAccessTokenMock(),
  generateRefreshTokenRaw: () => generateRefreshTokenRawMock(),
  normalizeUsername: (v: string) => v.trim().toLowerCase(),
  refreshExpiresAt: () => new Date(Date.now() + 86400_000),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { AuthService } from './auth.service';

const publicUser = {
  id: 'user_1',
  username: 'admin',
  name: 'Admin',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function createService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const users = {
    getPublicUser: jest.fn().mockResolvedValue(publicUser),
  };
  const service = new AuthService(prisma as never, users as never);
  return { service, prisma, users };
}

describe('AuthService.resolveSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    accessMaxAgeSecMock.mockReturnValue(900);
  });

  it('returns user when access token is valid without refresh', async () => {
    verifyAccessTokenMock.mockReturnValue({ sub: 'user_1', username: 'admin' });
    extractAccessTokenFromRequestMock.mockReturnValue('valid-access');

    const { service, users } = createService();
    const result = await service.resolveSession({});

    expect(result).toEqual({
      user: publicUser,
      accessExpiresIn: 900,
      refreshed: false,
    });
    expect(users.getPublicUser).toHaveBeenCalledWith('user_1');
    expect(extractRefreshTokenFromRequestMock).not.toHaveBeenCalled();
  });

  it('silently refreshes when access is invalid but refresh is valid', async () => {
    verifyAccessTokenMock.mockReturnValue(null);
    extractAccessTokenFromRequestMock.mockReturnValue('expired-access');
    extractRefreshTokenFromRequestMock.mockReturnValue('refresh-old');

    const { service, prisma } = createService();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt_1',
      userId: 'user_1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      username: 'admin',
    });
    prisma.refreshToken.delete.mockResolvedValue(undefined);
    prisma.refreshToken.create.mockResolvedValue(undefined);

    const result = await service.resolveSession({});

    expect(result.refreshed).toBe(true);
    expect(result.user).toEqual(publicUser);
    expect(result.tokens).toEqual({
      accessToken: 'access-jwt',
      refreshToken: 'refresh-raw-new',
      user: publicUser,
    });
    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: 'rt_1' },
    });
  });

  it('throws when access and refresh are both missing or invalid', async () => {
    verifyAccessTokenMock.mockReturnValue(null);
    extractRefreshTokenFromRequestMock.mockReturnValue(undefined);

    const { service } = createService();

    await expect(service.resolveSession({})).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
