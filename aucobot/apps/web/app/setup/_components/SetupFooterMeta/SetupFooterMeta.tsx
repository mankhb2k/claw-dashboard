"use client";

import styles from "./SetupFooterMeta.module.css";
import { Flex } from "@/components/layout";
import { Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

interface SetupFooterMetaProps {
  oss: boolean;
}

export function SetupFooterMeta({ oss }: SetupFooterMetaProps) {
  const { t } = useI18n();

  if (oss) return null;

  return (
    <Flex direction="column" align="center" className={styles.root}>
      <Typography variant="xs" color="muted">
        {t("setup.footer.hint")} <strong>{t("setup.footer.start")}</strong>.{" "}
        {t("setup.footer.missing")} <strong>{t("setup.footer.respawn")}</strong>.
      </Typography>
    </Flex>
  );
}
