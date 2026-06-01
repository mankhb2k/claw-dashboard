"use client";

import React, { useEffect, useState } from "react";
import { Typography, Checkbox, Card } from "@/components/ui";
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
            Add to agent collaboration
          </Typography>
          <Typography variant="small" color="muted">
            {collaborationEnabled
              ? "Include this agent in the project collaboration pool after save."
              : "Enables collaboration and adds this agent after save."}
          </Typography>
        </div>
        <Checkbox
          id="join-collaboration-on-create"
          size="sm"
          checked={checked}
          onCheckedChange={(val) => onCheckedChange(val === true)}
          aria-label="Add to agent collaboration after save"
        />
      </div>
    </Card>
  );
}
