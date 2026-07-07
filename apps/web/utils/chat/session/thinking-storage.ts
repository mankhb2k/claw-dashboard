import {
  DEFAULT_THINKING_LEVEL,
  normalizeThinkingLevel,
  type ThinkingLevel,
} from '@/utils/chat/thinking-level';

const STORAGE_PREFIX = 'chat-session-thinking:';

function storageKey(
  projectId: string,
  agentId: string,
  sessionKey: string,
): string {
  return `${STORAGE_PREFIX}${projectId}:${agentId}:${sessionKey}`;
}

export function loadSessionThinkingSelection(
  projectId: string,
  agentId: string,
  sessionKey: string,
): ThinkingLevel | null {
  if (typeof window === 'undefined' || !projectId || !sessionKey) return null;
  try {
    const raw = sessionStorage.getItem(
      storageKey(projectId, agentId, sessionKey),
    );
    if (!raw) return null;
    return normalizeThinkingLevel(raw);
  } catch {
    return null;
  }
}

export function saveSessionThinkingSelection(
  projectId: string,
  agentId: string,
  sessionKey: string,
  thinkingLevel: ThinkingLevel,
): void {
  if (typeof window === 'undefined' || !projectId || !sessionKey) return;
  sessionStorage.setItem(
    storageKey(projectId, agentId, sessionKey),
    thinkingLevel,
  );
}

export function clearSessionThinkingSelection(
  projectId: string,
  agentId: string,
  sessionKey: string,
): void {
  if (typeof window === 'undefined' || !projectId || !sessionKey) return;
  sessionStorage.removeItem(storageKey(projectId, agentId, sessionKey));
}

/** Gateway row > sessionStorage > default (`off`). */
export function resolveSessionThinkingLevel(
  projectId: string,
  agentId: string,
  sessionKey: string,
  gatewayThinkingLevel?: string | null,
): ThinkingLevel {
  const fromGateway = normalizeThinkingLevel(gatewayThinkingLevel ?? undefined);
  if (fromGateway) return fromGateway;
  const stored = loadSessionThinkingSelection(
    projectId,
    agentId,
    sessionKey,
  );
  if (stored) return stored;
  return DEFAULT_THINKING_LEVEL;
}
