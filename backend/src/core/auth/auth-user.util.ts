export type PublicUser = {
  id: string;
  login: string;
  name: string;
  createdAt: string;
};

export function toPublicUser(user: {
  id: string;
  login: string;
  name: string | null;
  createdAt: Date;
}): PublicUser {
  const login = user.login.trim();
  return {
    id: user.id,
    login,
    name: user.name?.trim() || login,
    createdAt: user.createdAt.toISOString(),
  };
}

export function normalizeLogin(raw: string): string {
  return raw.trim().toLowerCase();
}
