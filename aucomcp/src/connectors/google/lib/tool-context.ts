import { google } from 'googleapis';
import type { ConnectorContext } from '../../types.js';
import { refreshGoogleAccessToken } from '../oauth.js';
import {
  escapeDriveQuery,
  FOLDER_MIME_TYPE,
  getExtensionFromFilename,
  TEXT_MIME_TYPES,
} from './drive-utils.js';
import type { ToolContext } from './types.js';

export function createToolContext(connectorCtx: ConnectorContext): ToolContext {
  const clientId = connectorCtx.secrets.client_id?.trim();
  const clientSecret = connectorCtx.secrets.client_secret?.trim();
  const refreshToken = connectorCtx.secrets.refresh_token?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials');
  }

  const authClient = new google.auth.OAuth2(clientId, clientSecret);
  authClient.setCredentials({ refresh_token: refreshToken });

  void refreshGoogleAccessToken(connectorCtx.secrets).then((accessToken) => {
    authClient.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken,
    });
  });

  let driveClient: ReturnType<typeof google.drive> | null = null;
  let calendarClient: ReturnType<typeof google.calendar> | null = null;

  const prefix = `[${connectorCtx.projectId}/${connectorCtx.connectorSlug}]`;

  const ctx: ToolContext = {
    authClient: authClient as unknown as ToolContext['authClient'],
    getDrive: () => {
      if (!driveClient) {
        driveClient = google.drive({ version: 'v3', auth: authClient });
      }
      return driveClient;
    },
    getCalendar: () => {
      if (!calendarClient) {
        calendarClient = google.calendar({ version: 'v3', auth: authClient });
      }
      return calendarClient;
    },
    log: (message, data) => {
      if (data !== undefined) {
        console.info(`${prefix} ${message}`, data);
      } else {
        console.info(`${prefix} ${message}`);
      }
    },
    resolveFolderId: async (input) => {
      if (!input || input === 'root') {
        return 'root';
      }
      const drive = ctx.getDrive();
      const res = await drive.files.get({
        fileId: input,
        fields: 'id,mimeType,name',
        supportsAllDrives: true,
      });
      if (res.data.mimeType !== FOLDER_MIME_TYPE) {
        throw new Error(`Not a folder: ${input} (${res.data.name ?? 'unknown'})`);
      }
      return res.data.id ?? input;
    },
    checkFileExists: async (name, parentFolderId) => {
      const parent = parentFolderId ?? 'root';
      const escapedName = escapeDriveQuery(name);
      const q = `name='${escapedName}' and '${parent}' in parents and trashed=false`;
      const res = await ctx.getDrive().files.list({
        q,
        fields: 'files(id)',
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      return res.data.files?.[0]?.id ?? null;
    },
    validateTextFileExtension: (name) => {
      const ext = getExtensionFromFilename(name);
      if (!TEXT_MIME_TYPES[ext]) {
        throw new Error('Text files must have .txt or .md extension');
      }
    },
  };

  return ctx;
}
