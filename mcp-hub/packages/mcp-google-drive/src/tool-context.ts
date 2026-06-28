import { google } from 'googleapis';
import type { GoogleOAuthSecrets } from '@aucobot/mcp-core';
import { refreshGoogleAccessToken } from '@aucobot/mcp-core';
import {
  escapeDriveQuery,
  FOLDER_MIME_TYPE,
  getExtensionFromFilename,
  TEXT_MIME_TYPES,
} from './drive-utils.js';

export interface DriveToolContext {
  authClient: { request: (opts: Record<string, unknown>) => Promise<{ data: unknown }> };
  getDrive: () => ReturnType<typeof google.drive>;
  log: (message: string, data?: unknown) => void;
  resolveFolderId: (input: string | undefined) => Promise<string>;
  checkFileExists: (name: string, parentFolderId?: string) => Promise<string | null>;
  validateTextFileExtension: (name: string) => void;
}

export function createDriveToolContext(secrets: GoogleOAuthSecrets): DriveToolContext {
  const clientId = secrets.client_id;
  const clientSecret = secrets.client_secret;
  const refreshToken = secrets.refresh_token;

  const authClient = new google.auth.OAuth2(clientId, clientSecret);
  authClient.setCredentials({ refresh_token: refreshToken });

  void refreshGoogleAccessToken(secrets).then((accessToken) => {
    authClient.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken,
    });
  });

  let driveClient: ReturnType<typeof google.drive> | null = null;

  const ctx: DriveToolContext = {
    authClient: authClient as unknown as DriveToolContext['authClient'],
    getDrive: () => {
      if (!driveClient) {
        driveClient = google.drive({ version: 'v3', auth: authClient });
      }
      return driveClient;
    },
    log: (message, data) => {
      if (data !== undefined) {
        console.error(`[aucobot-mcp-google-drive] ${message}`, data);
      } else {
        console.error(`[aucobot-mcp-google-drive] ${message}`);
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
