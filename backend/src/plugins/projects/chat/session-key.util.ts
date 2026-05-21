/** Session key for dashboard WebChat (matches OpenClaw main session conventions). */
export function sessionKeyForAgent(agentId: string): string {
  const id = agentId.trim().toLowerCase() || 'main';
  if (id === 'main') return 'main';
  return `agent:${id}:main`;
}
