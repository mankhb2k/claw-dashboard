/** Map OpenClaw catalog id (google/..., openai/...) to provider-native model id. */
export function toNativeModelId(model: string, prefix: string): string {
  const trimmed = model.trim();
  const p = `${prefix}/`;
  if (trimmed.startsWith(p)) {
    return trimmed.slice(p.length);
  }
  return trimmed;
}
