import { createGoogleOAuthConnector } from '../create-google-oauth-connector';

export const GOOGLE_DRIVE_CONNECTOR = createGoogleOAuthConnector({
  id: 'google-drive',
  slug: 'google-drive',
  displayName: 'Google Drive',
  description:
    'Đọc, ghi và quản lý file trên Google Drive qua MCP. Cần kết nối lại sau khi nâng cấp quyền OAuth.',
  oauthScopes: ['https://www.googleapis.com/auth/drive'],
  mcpServerId: 'google-drive',
});
