export type PublicUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

export function toPublicUser(user: {
  id: string;
  username: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
}): PublicUser {
  const username = user.username.trim();
  const avatar = user.avatarUrl?.trim();
  return {
    id: user.id,
    username,
    name: user.name?.trim() || username,
    avatarUrl: avatar || null,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Lowercase username for lookup and uniqueness. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
