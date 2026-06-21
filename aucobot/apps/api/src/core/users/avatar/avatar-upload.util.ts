import { BadRequestException } from '@nestjs/common';

import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_BYTES,
} from '@aucobot/runtime-contracts';

import type { MultipartFile } from '@fastify/multipart';
import type { FastifyRequest } from 'fastify';

export async function readAvatarUpload(req: FastifyRequest): Promise<{
  data: Buffer;
  mimeType: string;
}> {
  let part: MultipartFile | undefined;
  try {
    part = await req.file({ limits: { fileSize: AVATAR_MAX_BYTES } });
  } catch {
    throw new BadRequestException(
      'Expected multipart/form-data with a file field named "file"',
    );
  }
  if (!part) {
    throw new BadRequestException('Avatar file is required (field: file)');
  }
  if (!part.mimetype || !AVATAR_ALLOWED_MIME_TYPES.has(part.mimetype)) {
    throw new BadRequestException('Unsupported image type');
  }
  const data = await part.toBuffer();
  if (data.length === 0) {
    throw new BadRequestException('Empty file');
  }
  if (data.length > AVATAR_MAX_BYTES) {
    throw new BadRequestException('Avatar must be 512 KB or smaller');
  }
  return { data, mimeType: part.mimetype };
}
