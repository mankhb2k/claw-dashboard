/** RPC methods the browser may forward through the Nest proxy. */
export const CHAT_RPC_WHITELIST = new Set([
  'chat.history',
  'chat.send',
  'chat.abort',
  'agents.list',
  'sessions.list',
  'sessions.create',
  'sessions.patch',
  'sessions.delete',
  'sessions.subscribe',
]);

export function isAllowedChatRpc(method: unknown): method is string {
  return typeof method === 'string' && CHAT_RPC_WHITELIST.has(method);
}
