export type PublicUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

export function toPublicUser(
  user: {
    id: string;
    username: string;
    name: string | null;
    createdAt: Date;
  },
  avatarDisplayUrl?: string | null,
): PublicUser {
  const username = user.username.trim();
  return {
    id: user.id,
    username,
    name: user.name?.trim() || username,
    avatarUrl: avatarDisplayUrl?.trim() || null,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Lowercase username for lookup and uniqueness. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}
