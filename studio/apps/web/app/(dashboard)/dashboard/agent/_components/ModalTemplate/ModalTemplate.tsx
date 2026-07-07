"use client";

import { Bot, Code, BarChart2, Brain, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./ModalTemplate.module.css";
import { Flex, Grid } from "@/components/layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Typography,
  Spinner,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";

import type { AgentTemplateRow } from "@/schemas/project.schema";

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
  const { t } = useI18n();
  const router = useRouter();
  const [templates, setTemplates] = useState<AgentTemplateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fetchKey = isOpen && projectId ? projectId : null;
  const [trackedFetchKey, setTrackedFetchKey] = useState<string | null>(null);

  if (fetchKey !== trackedFetchKey) {
    setTrackedFetchKey(fetchKey);
    if (fetchKey) {
      setLoading(true);
      setLoadError(null);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen || !projectId) return;
    void projectApi
      .listAgentTemplates(projectId)
      .then((rows) => {
        setTemplates(rows);
        setLoadError(null);
      })
      .catch(() => {
        setTemplates([]);
        setLoadError(t("agent.modalTemplate.loadError"));
      })
      .finally(() => setLoading(false));
  }, [isOpen, projectId, t]);

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
        <DialogHeader className={styles.dialogHeader}>
          <DialogTitle>{t("agent.modalTemplate.title")}</DialogTitle>
          <DialogDescription>
            {t("agent.modalTemplate.description")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <Flex align="center" justify="center" className={styles.loadingArea}>
            <Spinner />
          </Flex>
        ) : loadError ? (
          <Typography variant="small" color="muted">
            {loadError}
          </Typography>
        ) : templates.length === 0 ? (
          <Typography variant="small" color="muted">
            {t("agent.modalTemplate.empty")}
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
                      className={styles.templateTitle}
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
