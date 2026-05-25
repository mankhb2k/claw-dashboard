export type PublicUser = {
  id: string;
  login: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

export function toPublicUser(user: {
  id: string;
  login: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
}): PublicUser {
  const login = user.login.trim();
  const avatar = user.avatarUrl?.trim();
  return {
    id: user.id,
    login,
    name: user.name?.trim() || login,
    avatarUrl: avatar || null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function normalizeLogin(raw: string): string {
  return raw.trim().toLowerCase();
}
