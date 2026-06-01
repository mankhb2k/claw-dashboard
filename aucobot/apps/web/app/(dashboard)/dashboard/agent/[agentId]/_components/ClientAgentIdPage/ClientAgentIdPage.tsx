"use client";

import React from "react";
import { useAgentEditorUiStore } from "@/stores/agent-editor-ui.store";
import { EditPanel } from "../EditPanel/EditPanel";
import { PreviewPanel } from "../PreviewPanel/PreviewPanel";
import styles from "./ClientAgentIdPage.module.css";

interface ClientAgentIdPageProps {
  agentId: string;
}

export function ClientAgentIdPage({ agentId }: ClientAgentIdPageProps) {
  const previewOpen = useAgentEditorUiStore((s) => s.previewOpen);
  const togglePreview = useAgentEditorUiStore((s) => s.togglePreview);

  return (
    <div className={styles.root}>
      <EditPanel
        agentId={agentId}
        isEditing
        previewOpen={previewOpen}
        onTogglePreview={togglePreview}
      />
      {previewOpen ? (
        <div className={styles.previewWrap}>
          <PreviewPanel agentSlug={agentId} />
        </div>
      ) : null}
    </div>
  );
}
