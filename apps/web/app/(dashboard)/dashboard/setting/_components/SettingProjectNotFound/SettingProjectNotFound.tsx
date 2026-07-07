"use client";

import styles from "../../setting.module.css";
import { useI18n } from "@/lib/i18n";

export function SettingProjectNotFound() {
  const { t } = useI18n();
  return <p className={styles.error}>{t("settings.page.projectNotFound")}</p>;
}
