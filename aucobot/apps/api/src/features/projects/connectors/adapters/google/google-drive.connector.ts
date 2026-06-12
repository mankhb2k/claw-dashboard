import { createGoogleOAuthConnector } from './create-google-oauth-connector';

export const GOOGLE_DRIVE_CONNECTOR = createGoogleOAuthConnector({
  id: 'google-drive',
  slug: 'google-drive',
  displayName: 'Google Drive',
  description: 'Đọc và tìm kiếm file trên Google Drive qua MCP.',
  oauthScopes: ['https://www.googleapis.com/auth/drive.readonly'],
  mcpServerId: 'google-drive',
});
