"use client";

import React from "react";
import { useAgentEditorUiStore } from "@/stores/agent-editor-ui.store";
import { EditPanel } from "../EditPanel/EditPanel";
import { AgentPanel } from "../AgentPanel/AgentPanel";
import styles from "./ClientAgentIdPage.module.css";

interface ClientAgentIdPageProps {
  agentId: string;
}

export function ClientAgentIdPage({ agentId }: ClientAgentIdPageProps) {
  const agentPanelOpen = useAgentEditorUiStore((s) => s.agentPanelOpen);
  const toggleAgentPanel = useAgentEditorUiStore((s) => s.toggleAgentPanel);

  return (
    <div className={styles.root}>
      <EditPanel
        agentId={agentId}
        isEditing
        previewOpen={agentPanelOpen}
        onTogglePreview={toggleAgentPanel}
      />
      {agentPanelOpen ? (
        <div className={styles.agentPanelWrap}>
          <AgentPanel />
        </div>
      ) : null}
    </div>
  );
}
