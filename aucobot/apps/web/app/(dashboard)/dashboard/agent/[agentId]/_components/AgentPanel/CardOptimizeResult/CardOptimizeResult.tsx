"use client";

import { FileText, X } from "lucide-react";
import { Box, Flex } from "@/components/layout";
import { Button, Card, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import styles from "./CardOptimizeResult.module.css";

export type CardOptimizeResultProps = {
  markdown: string;
  summary?: string;
  onApply: () => void;
  onDismiss: () => void;
  applying?: boolean;
};

export function CardOptimizeResult({
  markdown,
  summary,
  onApply,
  onDismiss,
  applying = false,
}: CardOptimizeResultProps) {
  const { t } = useI18n();

  return (
    <Card disableHover className={styles.card}>
      <Flex justify="between" align="start" gap={8}>
        <Box>
          <Typography variant="p" weight="bold">
            {t("agent.panel.optimize.title")}
          </Typography>
          {summary ? (
            <Typography variant="small" color="muted" className={styles.summary}>
              {summary}
            </Typography>
          ) : null}
        </Box>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          title={t("agent.panel.optimize.dismiss")}
          onClick={onDismiss}
          disabled={applying}
        >
          <X size={16} />
        </Button>
      </Flex>

      <pre className={styles.preview}>{markdown}</pre>

      <Flex gap={8} className={styles.actions}>
        <Button type="button" size="sm" onClick={onApply} disabled={applying}>
          <FileText size={14} aria-hidden />
          {applying
            ? t("agent.panel.optimize.applying")
            : t("agent.panel.optimize.apply")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDismiss}
          disabled={applying}
        >
          {t("agent.panel.optimize.dismiss")}
        </Button>
      </Flex>

      <Typography variant="xs" color="muted">
        {t("agent.panel.optimize.hint")}
      </Typography>
    </Card>
  );
}
