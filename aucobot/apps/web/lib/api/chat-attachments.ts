import { uploadMultipart } from '@/lib/api/multipart-upload';

export type ChatAttachmentUploadResult = {
  id: string;
  kind: 'image' | 'document';
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  status: string;
  url: string;
};

export function chatAttachmentDownloadPath(
  projectId: string,
  attachmentId: string,
): string {
  return `/api/projects/${projectId}/chat/attachments/${attachmentId}`;
}

export async function uploadChatAttachment(
  projectId: string,
  file: File,
): Promise<ChatAttachmentUploadResult> {
  const form = new FormData();
  form.append('file', file);
  const data = await uploadMultipart(
    `/api/projects/${projectId}/chat/attachments`,
    form,
  );
  return data as ChatAttachmentUploadResult;
}

export async function deleteChatAttachment(
  projectId: string,
  attachmentId: string,
): Promise<void> {
  const base =
    typeof window !== 'undefined'
      ? ''
      : process.env.NEXT_PUBLIC_API_URL ?? '';
  const url = `${base}/api/projects/${projectId}/chat/attachments/${attachmentId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Could not delete attachment');
  }
}
