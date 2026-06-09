const STORAGE_PREFIX = 'chat-session-model:';

function storageKey(
  projectId: string,
  agentId: string,
  sessionKey: string,
): string {
  return `${STORAGE_PREFIX}${projectId}:${agentId}:${sessionKey}`;
}

export function loadSessionModelSelection(
  projectId: string,
  agentId: string,
  sessionKey: string,
): { providerId?: string; modelId?: string } | null {
  if (typeof window === 'undefined' || !projectId || !sessionKey) return null;
  try {
    const raw = sessionStorage.getItem(
      storageKey(projectId, agentId, sessionKey),
    );
    if (!raw) return null;
    return JSON.parse(raw) as { providerId?: string; modelId?: string };
  } catch {
    return null;
  }
}

export function saveSessionModelSelection(
  projectId: string,
  agentId: string,
  sessionKey: string,
  providerId: string,
  modelId: string,
): void {
  if (typeof window === 'undefined' || !projectId || !sessionKey) return;
  sessionStorage.setItem(
    storageKey(projectId, agentId, sessionKey),
    JSON.stringify({ providerId, modelId }),
  );
}

export function clearSessionModelSelection(
  projectId: string,
  agentId: string,
  sessionKey: string,
): void {
  if (typeof window === 'undefined' || !projectId || !sessionKey) return;
  sessionStorage.removeItem(storageKey(projectId, agentId, sessionKey));
}
