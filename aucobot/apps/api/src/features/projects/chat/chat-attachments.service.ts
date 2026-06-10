import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import {
  CHAT_ATTACHMENT_MAX_COUNT,
  SANDBOX_STAGING_MAX_BYTES,
  agentSlugFromSessionKey,
  classifyChatAttachmentKind,
  resolveEffectiveSandboxActive,
  type ChatAttachmentKind,
  type ChatAttachmentStorage,
} from '@aucobot/runtime-contracts';
import { parseCollaborationMemberSlugs } from '@aucobot/workspace-sync';
import {
  ChatAttachmentKind as DbAttachmentKind,
  ChatAttachmentStatus,
} from '@aucobot/database';
import { PrismaService } from '../../../core/database/prisma.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { readChatAttachmentUpload } from './chat-attachment-upload.util';
import {
  CHAT_ATTACHMENT_STORAGE,
} from './storage/chat-attachment-storage.provider';

const ORPHAN_HOURS = 24;

function toPrismaKind(kind: ChatAttachmentKind): DbAttachmentKind {
  return kind === 'image' ? DbAttachmentKind.IMAGE : DbAttachmentKind.DOCUMENT;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').slice(0, 200) || 'attachment';
}

@Injectable()
export class ChatAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspace: WorkspaceService,
    @Inject(CHAT_ATTACHMENT_STORAGE) private readonly storage: ChatAttachmentStorage,
  ) {}

  async upload(projectId: string, userId: string, req: FastifyRequest) {
    await this.workspace.ensureProjectLayout(projectId);

    const pendingCount = await this.prisma.chatAttachment.count({
      where: { projectId, userId, status: ChatAttachmentStatus.PENDING },
    });
    if (pendingCount >= CHAT_ATTACHMENT_MAX_COUNT) {
      throw new BadRequestException(`Maximum ${CHAT_ATTACHMENT_MAX_COUNT} pending attachments`);
    }

    const { data, mimeType, originalName } = await readChatAttachmentUpload(req);
    const kind = classifyChatAttachmentKind(mimeType, originalName);
    if (!kind) {
      throw new BadRequestException('Unsupported file type');
    }

    const attachmentId = randomUUID();
    const saved = await this.storage.save({
      projectId,
      kind,
      buffer: data,
      mimeType,
      attachmentId,
    });

    const expiresAt = new Date(Date.now() + ORPHAN_HOURS * 60 * 60 * 1000);
    const row = await this.prisma.chatAttachment.create({
      data: {
        id: attachmentId,
        projectId,
        userId,
        kind: toPrismaKind(kind),
        mimeType,
        originalName: sanitizeFilename(originalName),
        sizeBytes: saved.sizeBytes,
        storagePath: saved.storagePath ?? null,
        storageKey: saved.storageKey ?? null,
        status: ChatAttachmentStatus.PENDING,
        expiresAt,
      },
    });

    return {
      id: row.id,
      kind: kind,
      mimeType: row.mimeType,
      originalName: row.originalName,
      sizeBytes: row.sizeBytes,
      status: row.status,
      url: `/api/projects/${projectId}/chat/attachments/${row.id}`,
    };
  }

  async readForDownload(projectId: string, attachmentId: string, userId: string) {
    const row = await this.prisma.chatAttachment.findFirst({
      where: { id: attachmentId, projectId, status: { not: ChatAttachmentStatus.DELETED } },
    });
    if (!row) {
      throw new NotFoundException('Attachment not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('Not allowed to access this attachment');
    }

    const result = await this.storage.read(projectId, {
      storagePath: row.storagePath,
      storageKey: row.storageKey,
    });

    return {
      buffer: result.buffer,
      mimeType: row.mimeType,
      originalName: row.originalName,
    };
  }

  async deletePending(projectId: string, attachmentId: string, userId: string) {
    const row = await this.prisma.chatAttachment.findFirst({
      where: { id: attachmentId, projectId, userId, status: ChatAttachmentStatus.PENDING },
    });
    if (!row) {
      throw new NotFoundException('Pending attachment not found');
    }

    await this.storage.delete(projectId, {
      storagePath: row.storagePath,
      storageKey: row.storageKey,
    });
    await this.prisma.chatAttachment.update({
      where: { id: row.id },
      data: { status: ChatAttachmentStatus.DELETED },
    });
    return { ok: true };
  }

  async resolveSandboxActive(projectId: string, sessionKey: string): Promise<boolean> {
    const agentSlug = agentSlugFromSessionKey(sessionKey);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        sandboxDefaultEnabled: true,
        sandboxDefaultMode: true,
        sandboxExemptAgentSlugs: true,
        sandboxAppliedAgentSlugs: true,
      },
    });
    if (!project) return false;

    const exemptSlugs = parseCollaborationMemberSlugs(project.sandboxExemptAgentSlugs);
    const appliedSlugs = parseCollaborationMemberSlugs(project.sandboxAppliedAgentSlugs);
    const mode =
      project.sandboxDefaultMode === 'selected' ||
      project.sandboxDefaultMode === 'non-main'
        ? 'selected'
        : 'all';

    return resolveEffectiveSandboxActive({
      agentSlug,
      sandboxExempt: exemptSlugs.includes(agentSlug),
      sandboxApplied: appliedSlugs.includes(agentSlug),
      projectSandboxDefaultEnabled: project.sandboxDefaultEnabled,
      projectSandboxDefaultMode: mode,
    });
  }

  async buildChatSendAttachments(params: {
    projectId: string;
    userId: string;
    attachmentIds: string[];
    sessionKey: string;
  }): Promise<Array<{ mimeType: string; fileName: string; content: string }>> {
    const { projectId, userId, attachmentIds, sessionKey } = params;
    if (!attachmentIds.length) return [];

    const rows = await this.prisma.chatAttachment.findMany({
      where: {
        id: { in: attachmentIds },
        projectId,
        userId,
        status: ChatAttachmentStatus.PENDING,
      },
    });

    if (rows.length !== attachmentIds.length) {
      throw new BadRequestException('One or more attachments are invalid or already sent');
    }

    const sandboxActive = await this.resolveSandboxActive(projectId, sessionKey);
    if (sandboxActive) {
      const oversized = rows.find((r) => r.sizeBytes > SANDBOX_STAGING_MAX_BYTES);
      if (oversized) {
        throw new BadRequestException(
          `SANDBOX_ATTACHMENT_TOO_LARGE: "${oversized.originalName}" exceeds 5 MB sandbox staging limit`,
        );
      }
    }

    const out: Array<{ mimeType: string; fileName: string; content: string }> = [];
    for (const row of rows) {
      const read = await this.storage.read(projectId, {
        storagePath: row.storagePath,
        storageKey: row.storageKey,
      });
      out.push({
        mimeType: row.mimeType,
        fileName: row.originalName,
        content: read.buffer.toString('base64'),
      });
    }
    return out;
  }

  async markLinked(params: {
    projectId: string;
    userId: string;
    attachmentIds: string[];
    sessionKey: string;
    linkedRunId: string;
  }) {
    await this.prisma.chatAttachment.updateMany({
      where: {
        id: { in: params.attachmentIds },
        projectId: params.projectId,
        userId: params.userId,
        status: ChatAttachmentStatus.PENDING,
      },
      data: {
        status: ChatAttachmentStatus.LINKED,
        sessionKey: params.sessionKey,
        linkedRunId: params.linkedRunId,
        expiresAt: null,
      },
    });
  }

  async cleanupOrphans(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - ORPHAN_HOURS * 60 * 60 * 1000);
    const rows = await this.prisma.chatAttachment.findMany({
      where: {
        status: ChatAttachmentStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      take: 500,
    });

    let deleted = 0;
    for (const row of rows) {
      await this.storage.delete(row.projectId, {
        storagePath: row.storagePath,
        storageKey: row.storageKey,
      });
      await this.prisma.chatAttachment.update({
        where: { id: row.id },
        data: { status: ChatAttachmentStatus.DELETED },
      });
      deleted += 1;
    }
    return { deleted };
  }
}
