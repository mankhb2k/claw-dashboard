import { PostgresAvatarStorage } from './avatar.storage';
import { USER_AVATAR_API_PATH } from '@aucobot/runtime-contracts';

describe('PostgresAvatarStorage', () => {
  const prisma = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const storage = new PostgresAvatarStorage(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves bytes to avatar_data', async () => {
    await storage.save('user-1', {
      data: Buffer.from('fake-image'),
      mimeType: 'image/png',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          avatarMimeType: 'image/png',
        }),
      }),
    );
  });

  it('resolveDisplayUrl returns API path when data exists', async () => {
    const updatedAt = new Date('2026-06-02T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue({
      avatarMimeType: 'image/png',
      avatarData: Buffer.from('x'),
      updatedAt,
    });

    const url = await storage.resolveDisplayUrl('user-1');

    expect(url).toBe(`${USER_AVATAR_API_PATH}?t=${updatedAt.getTime()}`);
  });
});
