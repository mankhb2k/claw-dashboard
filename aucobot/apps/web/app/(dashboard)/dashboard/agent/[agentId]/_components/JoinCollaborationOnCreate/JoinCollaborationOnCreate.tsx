"use client";

import React, { useEffect, useState } from "react";
import { Typography, Checkbox, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import styles from "./JoinCollaborationOnCreate.module.css";

interface JoinCollaborationOnCreateProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function JoinCollaborationOnCreate({
  checked,
  onCheckedChange,
}: JoinCollaborationOnCreateProps) {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setCollaborationEnabled(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    void projectApi
      .getCollaboration(projectId)
      .then((data) => setCollaborationEnabled(data.enabled))
      .catch(() => setCollaborationEnabled(false))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return null;
  }

  return (
    <Card className={styles.card} disableHover>
      <div className={styles.row}>
        <div className={styles.text}>
          <Typography variant="p" weight="medium">
            {t("agent.joinCollaboration.label")}
          </Typography>
          <Typography variant="small" color="muted">
            {collaborationEnabled
              ? t("agent.joinCollaboration.descriptionOn")
              : t("agent.joinCollaboration.descriptionOff")}
          </Typography>
        </div>
        <Checkbox
          id="join-collaboration-on-create"
          size="sm"
          checked={checked}
          onCheckedChange={(val) => onCheckedChange(val === true)}
          aria-label={t("agent.joinCollaboration.aria")}
        />
      </div>
    </Card>
  );
}
