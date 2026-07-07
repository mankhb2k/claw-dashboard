"use client";

import styles from "./ClientAgentIdPage.module.css";
import { AgentPanel } from "../AgentPanel/AgentPanel";
import { EditPanel } from "../EditPanel/EditPanel";
import { useAgentEditorStore } from "@/stores/agent/agent-editor.store";

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
