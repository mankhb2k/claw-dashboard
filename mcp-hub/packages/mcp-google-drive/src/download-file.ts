import type { drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';

export const GOOGLE_WORKSPACE_EXPORT_FORMATS: Record<string, Record<string, string>> = {
  'application/vnd.google-apps.document': {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    md: 'text/markdown',
    txt: 'text/plain',
    html: 'text/html',
    rtf: 'application/rtf',
    odt: 'application/vnd.oasis.opendocument.text',
    epub: 'application/epub+zip',
  },
  'application/vnd.google-apps.spreadsheet': {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    pdf: 'application/pdf',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    tsv: 'text/tab-separated-values',
    html: 'text/html',
  },
  'application/vnd.google-apps.presentation': {
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pdf: 'application/pdf',
    txt: 'text/plain',
    odp: 'application/vnd.oasis.opendocument.presentation',
  },
  'application/vnd.google-apps.drawing': {
    png: 'image/png',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
  },
};

export const GOOGLE_WORKSPACE_DEFAULT_EXPORT: Record<string, { mimeType: string; ext: string }> = {
  'application/vnd.google-apps.document': { mimeType: 'text/plain', ext: '.txt' },
  'application/vnd.google-apps.spreadsheet': { mimeType: 'text/csv', ext: '.csv' },
  'application/vnd.google-apps.presentation': { mimeType: 'text/plain', ext: '.txt' },
  'application/vnd.google-apps.drawing': { mimeType: 'image/png', ext: '.png' },
};

/** Max inline content size (~4MB). */
export const MAX_INLINE_BYTES = 4 * 1024 * 1024;

export type DownloadFileArgs = {
  fileId: string;
  exportMimeType?: string;
  returnInline?: boolean;
};

export type InlineDownloadResult = {
  driveName: string;
  driveMimeType: string;
  exportMime?: string;
  isWorkspaceFile: boolean;
  size: number;
  /** Text content when MIME is textual. */
  textContent?: string;
  /** Base64 when binary. */
  contentBase64?: string;
  truncated?: boolean;
};

function resolveWorkspaceExport(
  driveMimeType: string,
  exportMimeType?: string,
): { exportMime: string } {
  const formatMap = GOOGLE_WORKSPACE_EXPORT_FORMATS[driveMimeType];
  if (!formatMap) {
    throw new Error(
      `Unsupported Google Workspace type for export: ${driveMimeType}. ` +
        'Supported types: Document, Spreadsheet, Presentation, Drawing.',
    );
  }

  if (exportMimeType) {
    const validMimes = Object.values(formatMap);
    if (!validMimes.includes(exportMimeType)) {
      throw new Error(
        `Unsupported export format '${exportMimeType}' for ${driveMimeType}. ` +
          `Supported: ${Object.entries(formatMap)
            .map(([ext, mime]) => `${mime} (.${ext})`)
            .join(', ')}`,
      );
    }
    return { exportMime: exportMimeType };
  }

  const defaultExport = GOOGLE_WORKSPACE_DEFAULT_EXPORT[driveMimeType];
  return { exportMime: defaultExport.mimeType };
}

function isTextMime(mime: string): boolean {
  return mime.startsWith('text/') || mime === 'application/json' || mime === 'application/javascript';
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function downloadDriveFileInline(
  drive: drive_v3.Drive,
  args: DownloadFileArgs,
  log: (message: string, data?: unknown) => void,
): Promise<InlineDownloadResult> {
  const fileMeta = await drive.files.get({
    fileId: args.fileId,
    fields: 'id, name, mimeType, size',
    supportsAllDrives: true,
  });

  const driveMimeType = fileMeta.data.mimeType ?? '';
  const driveName = fileMeta.data.name || 'download';

  if (!driveMimeType) {
    throw new Error('File has no MIME type');
  }

  const isWorkspaceFile = driveMimeType.startsWith('application/vnd.google-apps');
  let exportMime: string | undefined;

  if (isWorkspaceFile) {
    exportMime = resolveWorkspaceExport(driveMimeType, args.exportMimeType).exportMime;
  }

  log('Downloading file inline', {
    fileId: args.fileId,
    driveName,
    driveMimeType,
    isWorkspaceFile,
    exportMime,
  });

  const response =
    isWorkspaceFile ?
      await drive.files.export(
        { fileId: args.fileId, mimeType: exportMime },
        { responseType: 'stream' },
      )
    : await drive.files.get(
        { fileId: args.fileId, alt: 'media', supportsAllDrives: true },
        { responseType: 'stream' },
      );

  const buffer = await streamToBuffer(response.data as Readable);
  const size = buffer.length;
  const effectiveMime = isWorkspaceFile ? (exportMime ?? driveMimeType) : driveMimeType;

  let truncated = false;
  let working = buffer;
  if (size > MAX_INLINE_BYTES) {
    working = buffer.subarray(0, MAX_INLINE_BYTES);
    truncated = true;
  }

  const result: InlineDownloadResult = {
    driveName,
    driveMimeType,
    exportMime,
    isWorkspaceFile,
    size,
    truncated,
  };

  if (isTextMime(effectiveMime)) {
    result.textContent = working.toString('utf8');
  } else {
    result.contentBase64 = working.toString('base64');
  }

  return result;
}

export function formatInlineDownloadResult(r: InlineDownloadResult): string {
  const lines = [
    `File: ${r.driveName}`,
    `Drive type: ${r.driveMimeType}`,
    `Size: ${r.size} bytes`,
  ];
  if (r.isWorkspaceFile && r.exportMime) {
    lines.push(`Export format: ${r.exportMime}`);
  }
  if (r.truncated) {
    lines.push(`Note: content truncated to ${MAX_INLINE_BYTES} bytes for inline response.`);
  }
  if (r.textContent !== undefined) {
    lines.push('', '--- Content ---', r.textContent);
  } else if (r.contentBase64 !== undefined) {
    lines.push('', `--- Content (base64${r.truncated ? ', truncated' : ''}) ---`, r.contentBase64);
  }
  return lines.join('\n');
}
