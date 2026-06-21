"use client";

import styles from "./ClientCreateAgentPage.module.css";
import { AgentPanel } from "../../../[agentId]/_components/AgentPanel/AgentPanel";
import { EditPanel } from "../../../[agentId]/_components/EditPanel/EditPanel";
import { useAgentEditorStore } from "@/stores/agent/agent-editor.store";

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
