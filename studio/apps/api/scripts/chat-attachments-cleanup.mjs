/**
 * Delete orphan PENDING chat attachments older than 24h (blob + DB).
 * Self-host: removes files under chat-uploads/ on disk (OPENCLAW_DATA_ROOT).
 *
 * Usage: pnpm --filter @claw-dashboard/api run cleanup:chat-attachments
 */
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient, ChatAttachmentStatus } from '@claw-dashboard/database';
import { resolveProjectDataDir } from '@claw-dashboard/workspace-sync';

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

async function deleteBlob(row) {
  if (!row.storagePath?.trim()) return;
  const dataDir = resolveProjectDataDir(row.projectId, { dataRoot });
  const abs = resolveSafePath(dataDir, row.storagePath);
  try {
    await unlink(abs);
  } catch {
    /* ignore missing */
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

  for (const row of rows) {
    await deleteBlob(row);
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
