"use client";

import React from "react";
import { EditPanel } from "../EditPanel/EditPanel";
import { PreviewPanel } from "../PreviewPanel/PreviewPanel";
import styles from "./ClientAgentIdPage.module.css";

interface ClientAgentIdPageProps {
  agentId: string;
}

export function ClientAgentIdPage({ agentId }: ClientAgentIdPageProps) {
  return (
    <div className={styles.root}>
      <EditPanel agentId={agentId} isEditing />
      <PreviewPanel />
    </div>
  );
}
