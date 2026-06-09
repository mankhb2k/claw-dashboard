"use client";

import Link from "next/link";
import styles from "./SkillAgentPanelModelBar.module.css";

export function SkillAgentPanelNoModelBanner() {
  return (
    <div className={styles.noModelBanner} role="status">
      <p className={styles.noModelText}>
        No LLM API key yet.{" "}
        <Link href="/dashboard/ai-model" className={styles.noModelLink}>
          Connect AI Model
        </Link>{" "}
        to use AI for writing skills.
      </p>
    </div>
  );
}
