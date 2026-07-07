"use client";

import Link from "next/link";

import styles from "./AgentPanelModelBar.module.css";
import { useI18n } from "@/lib/i18n";

export function AgentPanelNoModelBanner() {
  const { t } = useI18n();

  return (
    <div className={styles.noModelBanner} role="status">
      <p className={styles.noModelText}>
        {t("agent.panel.modelBar.noKey")}{" "}
        <Link href="/dashboard/ai-model" className={styles.noModelLink}>
          {t("agent.panel.modelBar.connect")}
        </Link>{" "}
        {t("agent.panel.modelBar.suffix")}
      </p>
    </div>
  );
}
