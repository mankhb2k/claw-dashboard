import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  chatAttachmentRelativePath,
  extensionForChatMime,
  type ChatAttachmentReadResult,
  type ChatAttachmentSaveInput,
  type ChatAttachmentSaveResult,
  type ChatAttachmentStorage,
  type ChatAttachmentStorageRef,
} from '@aucobot/runtime-contracts';
import { resolveProjectDataDir } from '@aucobot/workspace-sync';
import { Injectable } from '@nestjs/common';

function resolveSafePath(dataDir: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.includes('..') || !normalized.startsWith('chat-uploads/')) {
    throw new Error('Invalid storage path');
  }
  const abs = path.resolve(dataDir, normalized);
  const root = path.resolve(dataDir);
  if (!abs.startsWith(root + path.sep) && abs !== root) {
    throw new Error('Path traversal rejected');
  }
  return abs;
}

@Injectable()
export class LocalChatAttachmentStorage implements ChatAttachmentStorage {
  private dataRoot(): string {
    return process.env.OPENCLAW_DATA_ROOT?.trim() || path.join(process.cwd(), 'data', 'projects');
  }

  async save(input: ChatAttachmentSaveInput): Promise<ChatAttachmentSaveResult> {
    const ext = extensionForChatMime(input.mimeType);
    const relativePath = chatAttachmentRelativePath(input.kind, input.attachmentId, ext);
    const dataDir = resolveProjectDataDir(input.projectId, { dataRoot: this.dataRoot() });
    const abs = resolveSafePath(dataDir, relativePath);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, input.buffer);
    return {
      storagePath: relativePath,
      sizeBytes: input.buffer.length,
    };
  }

  async read(
    projectId: string,
    ref: ChatAttachmentStorageRef,
  ): Promise<ChatAttachmentReadResult> {
    if (!ref.storagePath?.trim()) {
      throw new Error('Missing storagePath');
    }
    const dataDir = resolveProjectDataDir(projectId, { dataRoot: this.dataRoot() });
    const abs = resolveSafePath(dataDir, ref.storagePath);
    const buffer = await readFile(abs);
    return { buffer, mimeType: 'application/octet-stream' };
  }

  async delete(projectId: string, ref: ChatAttachmentStorageRef): Promise<void> {
    if (!ref.storagePath?.trim()) return;
    const dataDir = resolveProjectDataDir(projectId, { dataRoot: this.dataRoot() });
    const abs = resolveSafePath(dataDir, ref.storagePath);
    try {
      await unlink(abs);
    } catch {
      /* ignore missing */
    }
  }
}
