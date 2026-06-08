/**
 * Delete orphan PENDING chat attachments older than 24h (blob + DB).
 * OSS: removes files under chat-uploads/ on disk.
 * Cloud: deletes R2 objects when CHAT_ATTACHMENT_S3_* env is configured.
 *
 * Usage: pnpm --filter @aucobot/api run cleanup:chat-attachments
 */
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, ChatAttachmentStatus } from '@aucobot/database';
import { resolveProjectDataDir } from '@aucobot/workspace-sync';

const ORPHAN_HOURS = 24;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot =
  process.env.OPENCLAW_DATA_ROOT?.trim() ||
  path.join(root, 'data', 'projects');

const prisma = new PrismaClient();

function resolveSafePath(dataDir, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.includes('..') || !normalized.startsWith('chat-uploads/')) {
    throw new Error(`Invalid storage path: ${relativePath}`);
  }
  const abs = path.resolve(dataDir, normalized);
  const rootDir = path.resolve(dataDir);
  if (!abs.startsWith(rootDir + path.sep) && abs !== rootDir) {
    throw new Error('Path traversal rejected');
  }
  return abs;
}

async function loadCloudStorage() {
  if (!process.env.CHAT_ATTACHMENT_S3_BUCKET?.trim()) return null;
  const mod = await import('@aucobot-cloud/chat-attachment-storage');
  return new mod.CloudChatAttachmentStorage();
}

async function deleteBlob(row, cloudStorage) {
  if (row.storagePath?.trim()) {
    const dataDir = resolveProjectDataDir(row.projectId, { dataRoot });
    const abs = resolveSafePath(dataDir, row.storagePath);
    try {
      await unlink(abs);
    } catch {
      /* ignore missing */
    }
  }
  if (row.storageKey?.trim() && cloudStorage) {
    await cloudStorage.delete(row.projectId, { storageKey: row.storageKey });
  }
}

async function main() {
  const cutoff = new Date(Date.now() - ORPHAN_HOURS * 60 * 60 * 1000);
  const rows = await prisma.chatAttachment.findMany({
    where: {
      status: ChatAttachmentStatus.PENDING,
      createdAt: { lt: cutoff },
    },
    take: 500,
  });
  console.log(
    `Found ${rows.length} orphan attachment(s) before ${cutoff.toISOString()}`,
  );

  const cloudStorage = await loadCloudStorage();
  if (cloudStorage) {
    console.log('Cloud R2 cleanup enabled (CHAT_ATTACHMENT_S3_BUCKET)');
  }

  for (const row of rows) {
    await deleteBlob(row, cloudStorage);
    await prisma.chatAttachment.update({
      where: { id: row.id },
      data: { status: ChatAttachmentStatus.DELETED },
    });
    console.log(`Deleted: ${row.id} (${row.originalName})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
