"use client";

import { FileText, X } from "lucide-react";
import { Box, Flex } from "@/components/layout";
import { Button, Card, Typography } from "@/components/ui";
import styles from "./OptimizeResultCard.module.css";

export type OptimizeResultCardProps = {
  markdown: string;
  summary?: string;
  onApply: () => void;
  onDismiss: () => void;
  applying?: boolean;
};

export function OptimizeResultCard({
  markdown,
  summary,
  onApply,
  onDismiss,
  applying = false,
}: OptimizeResultCardProps) {
  return (
    <Card disableHover className={styles.card}>
      <Flex justify="between" align="start" gap={8}>
        <Box>
          <Typography variant="p" weight="bold">
            Optimized AGENTS.md
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
          title="Dismiss"
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
          {applying ? "Applying…" : "Apply to Instructions"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDismiss}
          disabled={applying}
        >
          Dismiss
        </Button>
      </Flex>

      <Typography variant="xs" color="muted">
        Applying overwrites the Instructions tab (Advanced markdown). Remember to save the agent afterward.
      </Typography>
    </Card>
  );
}
