import { createGoogleOAuthConnector } from '../create-google-oauth-connector';

export const GOOGLE_CALENDAR_CONNECTOR = createGoogleOAuthConnector({
  id: 'google-calendar',
  slug: 'google-calendar',
  displayName: 'Google Calendar',
  description: 'Xem và quản lý sự kiện lịch Google qua MCP.',
  oauthScopes: ['https://www.googleapis.com/auth/calendar'],
  mcpServerId: 'google-calendar',
});
