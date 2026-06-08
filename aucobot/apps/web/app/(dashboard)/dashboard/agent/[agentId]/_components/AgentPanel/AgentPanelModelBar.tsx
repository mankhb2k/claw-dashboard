"use client";

import Link from "next/link";
import styles from "./AgentPanelModelBar.module.css";

export function AgentPanelNoModelBanner() {
  return (
    <div className={styles.noModelBanner} role="status">
      <p className={styles.noModelText}>
        Chưa có API key LLM.{" "}
        <Link href="/dashboard/ai-model" className={styles.noModelLink}>
          Kết nối AI Model
        </Link>{" "}
        để dùng Optimize with AI và chat AI.
      </p>
    </div>
  );
}
