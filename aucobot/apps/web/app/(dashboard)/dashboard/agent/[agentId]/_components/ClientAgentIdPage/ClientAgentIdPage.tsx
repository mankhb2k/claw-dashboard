"use client";

import React from "react";
import { useAgentEditorStore } from "@/stores/agent/agent-editor.store";
import { EditPanel } from "../EditPanel/EditPanel";
import { AgentPanel } from "../AgentPanel/AgentPanel";
import styles from "./ClientAgentIdPage.module.css";

interface ClientAgentIdPageProps {
  agentId: string;
}

export function ClientAgentIdPage({ agentId }: ClientAgentIdPageProps) {
  const agentPanelOpen = useAgentEditorStore((s) => s.agentPanelOpen);
  const toggleAgentPanel = useAgentEditorStore((s) => s.toggleAgentPanel);

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
