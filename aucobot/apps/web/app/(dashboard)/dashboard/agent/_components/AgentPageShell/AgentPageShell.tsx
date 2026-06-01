"use client";

import React from "react";
import { AgentSectionNav } from "../AgentSectionNav/AgentSectionNav";
import styles from "./AgentPageShell.module.css";

export function AgentPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AgentSectionNav />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
