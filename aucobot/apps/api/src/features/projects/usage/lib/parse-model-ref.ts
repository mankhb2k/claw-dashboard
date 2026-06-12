/** Split openclaw model ref `provider/model` or return provider-less model id. */
export function parseModelRef(modelRef: string): {
  providerId: string | null;
  modelId: string;
} {
  const trimmed = modelRef.trim();
  if (!trimmed) {
    return { providerId: null, modelId: 'unknown' };
  }
  const slash = trimmed.indexOf('/');
  if (slash <= 0) {
    return { providerId: null, modelId: trimmed };
  }
  const provider = trimmed.slice(0, slash).trim();
  const modelId = trimmed.slice(slash + 1).trim() || trimmed;
  const providerId =
    provider === 'google' ? 'gemini' : provider === 'openai' ? 'openai' : provider;
  return { providerId, modelId: trimmed };
}

export function extractAgentSlugFromSessionKey(sessionKey: string): string | undefined {
  const key = sessionKey.trim();
  if (!key) return undefined;
  const parts = key.split(':').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'agent') {
    return parts[1];
  }
  return undefined;
}
