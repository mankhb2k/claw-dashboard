"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Typography,
  Spinner,
} from "@/components/ui";
import { Flex, Grid } from "@/components/layout";
import { Bot, Code, BarChart2, Brain, Settings } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import type { AgentTemplateRow } from "@/schemas/project.schema";
import styles from "./ModalTemplate.module.css";

interface ModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function ModalTemplate({
  isOpen,
  onClose,
  projectId,
}: ModalTemplateProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<AgentTemplateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    setLoading(true);
    setLoadError(null);
    void projectApi
      .listAgentTemplates(projectId)
      .then((rows) => {
        setTemplates(rows);
        setLoadError(null);
      })
      .catch(() => {
        setTemplates([]);
        setLoadError(
          "Could not load templates. Check that the API is running and the database is seeded (pnpm db:seed).",
        );
      })
      .finally(() => setLoading(false));
  }, [isOpen, projectId]);

  const handleSelectTemplate = (templateSlug: string) => {
    onClose();
    router.push(`/dashboard/agent/create?template=${templateSlug}`);
  };

  const getIcon = (id: string) => {
    switch (id) {
      case "customer-support":
        return <Bot className={styles.iconBot} size={22} />;
      case "coding-assistant":
        return <Code className={styles.iconCode} size={22} />;
      case "data-analyst":
        return <BarChart2 className={styles.iconAnalyst} size={22} />;
      case "orchestrator":
        return <Brain className={styles.iconOrchestrator} size={22} />;
      default:
        return <Settings className={styles.iconDefault} size={22} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modalContent} showClose={true}>
        <DialogHeader style={{ gap: 10, marginBottom: "var(--space-6)" }}>
          <DialogTitle>Choose a template to start your project</DialogTitle>
          <DialogDescription>
            Start your project faster by choosing from the optimized templates
            available in the OpenClaw library, or start from scratch with no
            number.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <Flex align="center" justify="center" style={{ minHeight: 120 }}>
            <Spinner />
          </Flex>
        ) : loadError ? (
          <Typography variant="small" color="muted">
            {loadError}
          </Typography>
        ) : templates.length === 0 ? (
          <Typography variant="small" color="muted">
            No templates in the system. Run database seed from{" "}
            <code>packages/database</code>: <code>pnpm db:seed</code>
          </Typography>
        ) : (
          <Grid columns={2} gap={12} className={styles.templateList}>
            {templates.map((template) => (
              <div
                key={template.slug}
                className={`${styles.templateCard} ${
                  template.slug === "empty" ? styles.emptyCard : ""
                }`}
                onClick={() => handleSelectTemplate(template.slug)}
              >
                <Flex gap={12} align="start">
                  <div className={styles.iconContainer}>
                    {getIcon(template.slug)}
                  </div>
                  <div className={styles.cardContent}>
                    <Typography
                      as="h4"
                      variant="small"
                      weight="medium"
                      style={{ marginBottom: 4 }}
                    >
                      {template.name}
                    </Typography>
                    <Typography variant="small" color="muted">
                      {template.description}
                    </Typography>
                  </div>
                </Flex>
              </div>
            ))}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}
