"use client";

import Link from "next/link";
import styles from "./AgentPanelModelBar.module.css";

export function AgentPanelNoModelBanner() {
  return (
    <div className={styles.noModelBanner} role="status">
      <p className={styles.noModelText}>
        No LLM API key yet.{" "}
        <Link href="/dashboard/ai-model" className={styles.noModelLink}>
          Connect AI Model
        </Link>{" "}
        to use Optimize with AI and AI chat.
      </p>
    </div>
  );
}
