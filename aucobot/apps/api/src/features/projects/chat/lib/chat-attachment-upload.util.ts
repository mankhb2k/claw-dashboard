import { BadRequestException } from '@nestjs/common';

import {
  CHAT_ATTACHMENT_MAX_DOC_BYTES,
  CHAT_ATTACHMENT_MAX_IMAGE_BYTES,
  classifyChatAttachmentKind,
  maxBytesForChatKind,
} from '@aucobot/runtime-contracts';

import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';

const MAX_UPLOAD = Math.max(
  CHAT_ATTACHMENT_MAX_IMAGE_BYTES,
  CHAT_ATTACHMENT_MAX_DOC_BYTES,
);

export async function readChatAttachmentUpload(req: FastifyRequest): Promise<{
  data: Buffer;
  mimeType: string;
  originalName: string;
}> {
  let part: MultipartFile | undefined;
  try {
    part = await req.file({ limits: { fileSize: MAX_UPLOAD } });
  } catch {
    throw new BadRequestException(
      'Expected multipart/form-data with a file field named "file"',
    );
  }
  if (!part) {
    throw new BadRequestException('File is required (field: file)');
  }
  const mimeType = part.mimetype?.trim() || 'application/octet-stream';
  const originalName = part.filename?.trim() || 'attachment';
  const kind = classifyChatAttachmentKind(mimeType, originalName);
  if (!kind) {
    throw new BadRequestException('Unsupported file type');
  }
  const data = await part.toBuffer();
  if (data.length === 0) {
    throw new BadRequestException('Empty file');
  }
  const maxBytes = maxBytesForChatKind(kind);
  if (data.length > maxBytes) {
    throw new BadRequestException(
      `File exceeds ${Math.round(maxBytes / (1024 * 1024))} MB limit`,
    );
  }
  return { data, mimeType, originalName };
}
