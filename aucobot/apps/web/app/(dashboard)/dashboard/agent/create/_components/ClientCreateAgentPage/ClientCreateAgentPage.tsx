"use client";

import React from "react";
import { useAgentEditorStore } from "@/stores/agent/agent-editor.store";
import { EditPanel } from "../../../[agentId]/_components/EditPanel/EditPanel";
import { AgentPanel } from "../../../[agentId]/_components/AgentPanel/AgentPanel";
import styles from "./ClientCreateAgentPage.module.css";

export function ClientCreateAgentPage() {
  const agentPanelOpen = useAgentEditorStore((s) => s.agentPanelOpen);
  const toggleAgentPanel = useAgentEditorStore((s) => s.toggleAgentPanel);

  return (
    <div className={styles.root}>
      <EditPanel
        isEditing={false}
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
