export const TEXT_MIME_TYPES: Record<string, string> = {
  txt: 'text/plain',
  md: 'text/markdown',
};

export function getExtensionFromFilename(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeTypeFromFilename(filename: string): string {
  const ext = getExtensionFromFilename(filename);
  return TEXT_MIME_TYPES[ext] || 'text/plain';
}

export function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
export const SHORTCUT_MIME_TYPE = 'application/vnd.google-apps.shortcut';

export const BINARY_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  opus: 'audio/opus',
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  '3gp': 'video/3gpp',
  pdf: 'application/pdf',
  zip: 'application/zip',
  gz: 'application/gzip',
  tar: 'application/x-tar',
  json: 'application/json',
  xml: 'application/xml',
  csv: 'text/csv',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
