jest.mock('../../../workspace/services/workspace/workspace.service', () => ({
  WorkspaceService: class MockWorkspaceService {},
}));

jest.mock('../../lib/chat-attachment-upload.util', () => ({
  readChatAttachmentUpload: jest.fn(),
}));

import { BadRequestException } from '@nestjs/common';

import { ChatAttachmentsService } from './chat-attachments.service';
import { readChatAttachmentUpload } from '../../lib/chat-attachment-upload.util';
import {
  CHAT_ATTACHMENT_MAX_COUNT,
  SANDBOX_STAGING_MAX_BYTES,
} from '@claw-dashboard/runtime-contracts';

const readChatAttachmentUploadMock =
  readChatAttachmentUpload as jest.MockedFunction<
    typeof readChatAttachmentUpload
  >;

const PROJECT_ID = 'proj_test_1';
const USER_ID = 'user_test_1';
const ATTACHMENT_ID = 'att-1';

function createService() {
  const prisma = {
    chatAttachment: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };
  const workspace = {
    ensureProjectLayout: jest.fn().mockResolvedValue('/data/proj'),
  };
  const storage = {
    save: jest.fn(),
    read: jest.fn(),
    delete: jest.fn(),
  };
  const service = new ChatAttachmentsService(
    prisma as never,
    workspace as never,
    storage,
  );
  return { service, prisma, workspace, storage };
}

describe('ChatAttachmentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('rejects when pending attachment count reaches the limit', async () => {
      const { service, prisma } = createService();
      prisma.chatAttachment.count.mockResolvedValue(CHAT_ATTACHMENT_MAX_COUNT);

      await expect(
        service.upload(PROJECT_ID, USER_ID, {} as never),
      ).rejects.toThrow(
        new BadRequestException(
          `Maximum ${CHAT_ATTACHMENT_MAX_COUNT} pending attachments`,
        ),
      );

      expect(readChatAttachmentUploadMock).not.toHaveBeenCalled();
    });
  });

  describe('buildChatSendAttachments', () => {
    it('rejects oversized attachments when sandbox is active', async () => {
      const { service, prisma, storage } = createService();
      const oversizedBytes = SANDBOX_STAGING_MAX_BYTES + 1;

      prisma.chatAttachment.findMany.mockResolvedValue([
        {
          id: ATTACHMENT_ID,
          mimeType: 'application/pdf',
          originalName: 'large.pdf',
          sizeBytes: oversizedBytes,
          storagePath: 'chat-uploads/doc/large.pdf',
          storageKey: null,
        },
      ]);
      prisma.project.findUnique.mockResolvedValue({
        sandboxDefaultEnabled: true,
        sandboxDefaultMode: 'all',
        sandboxExemptAgentSlugs: [],
        sandboxAppliedAgentSlugs: [],
      });
      storage.read.mockResolvedValue({ buffer: Buffer.from('pdf') });

      await expect(
        service.buildChatSendAttachments({
          projectId: PROJECT_ID,
          userId: USER_ID,
          attachmentIds: [ATTACHMENT_ID],
          sessionKey: 'agent:main:direct',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'SANDBOX_ATTACHMENT_TOO_LARGE: "large.pdf" exceeds 5 MB sandbox staging limit',
        ),
      );

      expect(storage.read).not.toHaveBeenCalled();
    });

    it('allows oversized attachments when sandbox is inactive', async () => {
      const { service, prisma, storage } = createService();
      const oversizedBytes = SANDBOX_STAGING_MAX_BYTES + 1;
      const fileBuffer = Buffer.from('pdf-content');

      prisma.chatAttachment.findMany.mockResolvedValue([
        {
          id: ATTACHMENT_ID,
          mimeType: 'application/pdf',
          originalName: 'large.pdf',
          sizeBytes: oversizedBytes,
          storagePath: 'chat-uploads/doc/large.pdf',
          storageKey: null,
        },
      ]);
      prisma.project.findUnique.mockResolvedValue({
        sandboxDefaultEnabled: false,
        sandboxDefaultMode: 'all',
        sandboxExemptAgentSlugs: [],
        sandboxAppliedAgentSlugs: [],
      });
      storage.read.mockResolvedValue({ buffer: fileBuffer });

      const attachments = await service.buildChatSendAttachments({
        projectId: PROJECT_ID,
        userId: USER_ID,
        attachmentIds: [ATTACHMENT_ID],
        sessionKey: 'agent:main:direct',
      });

      expect(attachments).toEqual([
        {
          mimeType: 'application/pdf',
          fileName: 'large.pdf',
          content: fileBuffer.toString('base64'),
        },
      ]);
      expect(storage.read).toHaveBeenCalledWith(PROJECT_ID, {
        storagePath: 'chat-uploads/doc/large.pdf',
        storageKey: null,
      });
    });

    it('rejects when attachment rows are missing or not pending', async () => {
      const { service, prisma } = createService();
      prisma.chatAttachment.findMany.mockResolvedValue([]);

      await expect(
        service.buildChatSendAttachments({
          projectId: PROJECT_ID,
          userId: USER_ID,
          attachmentIds: [ATTACHMENT_ID],
          sessionKey: 'agent:main:direct',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'One or more attachments are invalid or already sent',
        ),
      );

      expect(prisma.project.findUnique).not.toHaveBeenCalled();
    });
  });
});
