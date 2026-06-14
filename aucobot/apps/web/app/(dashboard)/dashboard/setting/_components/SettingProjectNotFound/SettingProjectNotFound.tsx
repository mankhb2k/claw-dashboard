"use client";

import { useI18n } from "@/lib/i18n";
import styles from "../../setting.module.css";

export function SettingProjectNotFound() {
  const { t } = useI18n();
  return <p className={styles.error}>{t("settings.page.projectNotFound")}</p>;
}
