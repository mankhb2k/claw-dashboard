"use client";

import React from "react";
import { useAgentEditorUiStore } from "@/stores/agent-editor-ui.store";
import { EditPanel } from "../../../[agentId]/_components/EditPanel/EditPanel";
import { PreviewPanel } from "../../../[agentId]/_components/PreviewPanel/PreviewPanel";
import styles from "./ClientCreateAgentPage.module.css";

export function ClientCreateAgentPage() {
  const previewOpen = useAgentEditorUiStore((s) => s.previewOpen);
  const togglePreview = useAgentEditorUiStore((s) => s.togglePreview);

  return (
    <div className={styles.root}>
      <EditPanel
        isEditing={false}
        previewOpen={previewOpen}
        onTogglePreview={togglePreview}
      />
      {previewOpen ? (
        <div className={styles.previewWrap}>
          <PreviewPanel />
        </div>
      ) : null}
    </div>
  );
}
