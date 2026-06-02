import { OssAvatarStorage } from './oss-avatar.storage';

describe('OssAvatarStorage', () => {
  const prisma = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const storage = new OssAvatarStorage(prisma as never);

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
          avatarStorageKey: null,
          avatarUrl: null,
        }),
      }),
    );
  });

  it('resolveDisplayUrl returns API path when data exists', async () => {
    prisma.user.findUnique.mockResolvedValue({
      avatarMimeType: 'image/png',
      avatarData: Buffer.from('x'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    });

    const url = await storage.resolveDisplayUrl('user-1');

    expect(url).toBe('/api/users/me/avatar?t=1748822400000');
  });
});
