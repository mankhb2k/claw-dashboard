import type { ProjectChatClient } from '@/lib/chat/project-chat-client';
import type { ThinkingLevel } from '@/utils/chat/thinking-level';

/**
 * OpenClaw gateway `sessions.patch` accepts `thinkingLevel: string | null`.
 * - string: session-only override (`off`, `low`, `medium`, `high`, `adaptive`, …)
 * - null: clear override and restore model/agent default
 * @see openclaw-fork src/gateway/sessions-patch.ts
 */
export async function patchSessionThinking(
  client: ProjectChatClient,
  sessionKey: string,
  thinkingLevel: ThinkingLevel | null,
): Promise<void> {
  const key = sessionKey.trim();
  if (!key) return;
  await client.request('sessions.patch', { key, thinkingLevel });
}
