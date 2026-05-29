"use client";

import React, { useState } from "react";
import { EditPanel } from "../EditPanel/EditPanel";
import { PreviewPanel } from "../PreviewPanel/PreviewPanel";
import styles from "./AgentEditorLayout.module.css";

interface AgentEditorLayoutProps {
  agentId?: string;
  isEditing: boolean;
}

export function AgentEditorLayout({ agentId, isEditing }: AgentEditorLayoutProps) {
  const [previewOpen, setPreviewOpen] = useState(true);

  return (
    <div className={styles.root}>
      <EditPanel
        agentId={agentId}
        isEditing={isEditing}
        previewOpen={previewOpen}
        onTogglePreview={() => setPreviewOpen((open) => !open)}
      />
      {previewOpen ? (
        <div className={styles.previewWrap}>
          <PreviewPanel />
        </div>
      ) : null}
    </div>
  );
}
