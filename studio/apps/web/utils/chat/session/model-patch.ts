import type { ProjectChatClient } from '@/lib/chat/project-chat-client';

/**
 * OpenClaw gateway `sessions.patch` accepts `model: string | null`.
 * - string: session-only override (`provider/model` openclawId)
 * - null: clear override and restore agent default
 * @see openclaw-fork src/gateway/sessions-patch.ts
 */
export async function patchSessionModel(
  client: ProjectChatClient,
  sessionKey: string,
  model: string | null,
): Promise<void> {
  const key = sessionKey.trim();
  if (!key) return;
  await client.request('sessions.patch', { key, model });
}
