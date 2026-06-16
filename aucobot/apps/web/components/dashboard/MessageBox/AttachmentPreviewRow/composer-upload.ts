import type { Dispatch, SetStateAction } from "react";
import {
  uploadChatAttachment,
  chatAttachmentDownloadPath,
} from "@/lib/api/chat-attachments";
import type { ComposerAttachment } from "./composer-attachments";

export async function uploadComposerAttachment(
  projectId: string,
  localId: string,
  file: File,
  setAttachments: Dispatch<SetStateAction<ComposerAttachment[]>>,
): Promise<void> {
  try {
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId ? { ...item, progress: 40, status: "uploading" } : item,
      ),
    );
    const result = await uploadChatAttachment(projectId, file);
    const previewUrl =
      result.kind === "image"
        ? chatAttachmentDownloadPath(projectId, result.id)
        : undefined;
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId
          ? {
              ...item,
              serverId: result.id,
              progress: 100,
              status: "ready",
              previewUrl: previewUrl ?? item.previewUrl,
            }
          : item,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === localId
          ? { ...item, status: "error", error: message, progress: 0 }
          : item,
      ),
    );
  }
}
