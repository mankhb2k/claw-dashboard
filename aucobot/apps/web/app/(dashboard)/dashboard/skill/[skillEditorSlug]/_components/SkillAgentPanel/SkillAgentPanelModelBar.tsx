"use client";

import Link from "next/link";
import styles from "./SkillAgentPanelModelBar.module.css";

export function SkillAgentPanelNoModelBanner() {
  return (
    <div className={styles.noModelBanner} role="status">
      <p className={styles.noModelText}>
        Chưa có API key LLM.{" "}
        <Link href="/dashboard/ai-model" className={styles.noModelLink}>
          Kết nối AI Model
        </Link>{" "}
        để dùng AI viết skill.
      </p>
    </div>
  );
}
