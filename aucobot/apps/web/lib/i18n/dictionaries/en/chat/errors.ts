export const enChatErrors = {
  loadSessions: 'Could not load sessions',
  agentError: 'The agent returned an error while processing your message',
  wsSessionExpired:
    'WebSocket rejected (session expired). Sign out and sign in again, or refresh the page.',
  gatewayNotReady: 'Gateway is not ready yet. Wait a few seconds, then click Retry.',
  gatewayUnreachable:
    'Cannot reach the gateway. Check the worker container and WebSocket proxy.',
  gatewayUnreachableOss:
    'Cannot reach the shared gateway. Ensure aucobot-gateway-dev is running on port 18789 and the API proxy is enabled.',
  changeModel: 'Failed to change model',
  changeThinking: 'Failed to change thinking level',
  loadModelCatalog: 'Failed to load model catalog',
  noSessionKey: 'Gateway did not return a session key',
  createSession: 'Could not create a new session',
  renameSession: 'Could not rename session',
  cannotDeleteMain: 'Cannot delete the main session',
  deleteSession: 'Could not delete session',
  loadStatus: 'Could not load chat status',
  loadHistory: 'Could not load chat history',
  sendMessage: 'Failed to send message',
  uploadFailed: 'Upload failed',
  uploadFailedStatus: 'Upload failed ({{status}})',
  noProjectUpload: 'No project selected for file upload.',
  deleteAttachment: 'Could not delete attachment',
  noProject: 'No project yet. Create one from Overview first.',
} as const
