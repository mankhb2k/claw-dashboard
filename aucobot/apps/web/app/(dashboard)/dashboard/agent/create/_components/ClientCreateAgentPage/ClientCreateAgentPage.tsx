"use client";

import React from "react";
import { useAgentEditorUiStore } from "@/stores/agent-editor-ui.store";
import { EditPanel } from "../../../[agentId]/_components/EditPanel/EditPanel";
import { AgentPanel } from "../../../[agentId]/_components/AgentPanel/AgentPanel";
import styles from "./ClientCreateAgentPage.module.css";

export function ClientCreateAgentPage() {
  const agentPanelOpen = useAgentEditorUiStore((s) => s.agentPanelOpen);
  const toggleAgentPanel = useAgentEditorUiStore((s) => s.toggleAgentPanel);

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
