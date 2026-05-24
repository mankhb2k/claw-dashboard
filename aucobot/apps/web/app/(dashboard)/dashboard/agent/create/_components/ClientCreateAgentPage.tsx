"use client";

import React from "react";
import { EditPanel } from "../../[agentId]/_components/EditPanel/EditPanel";
import { PreviewPanel } from "../../[agentId]/_components/PreviewPanel/PreviewPanel";
import styles from "./ClientCreateAgentPage.module.css";

export function ClientCreateAgentPage() {
  return (
    <div className={styles.root}>
      <EditPanel isEditing={false} />
      <PreviewPanel />
    </div>
  );
}
