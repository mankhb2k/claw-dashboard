"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./DangerZone.module.css";
import { TitleSection } from "../TitleSection/TitleSection";
import { Flex } from "@/components/layout";
import { Button, Input, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";

import type { Project } from "@/schemas/project.schema";

interface Props {
  project: Project;
}

export function DangerZone({ project }: Props) {
  /* 1. STATE & HOOKS */
  const { t } = useI18n();
  const router = useRouter();
  const destroyProject = useProjectStore((s) => s.destroyProject);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* 2. DERIVED STATE */
  // TODO: Revert these after testing
  const isRunning = false; // project.status === "running" || project.status === "starting";
  const canDelete = true; // !isRunning && project.status !== "creating" && project.status !== "stopping";
  const confirmMatch = confirmName.trim() === project.displayName.trim();

  /* 3. HANDLERS */
  const handleDelete = async () => {
    if (!confirmMatch) return;
    setLoading(true);
    setError(null);
    try {
      await destroyProject(project.id);
      router.push("/projects");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("settings.dangerZone.errors.delete"),
      );
      setLoading(false);
    }
  };

  /* 4. RENDER */
  return (
    <Flex direction="column" gap={24}>
      {/* HEADER SECTION */}
      <TitleSection
        title={t("settings.dangerZone.title")}
        description={t("settings.dangerZone.description")}
      />

      {/* DANGER CARD SECTION */}
      <div className={styles.card}>
        <div className={styles.warningContentWrapper}>
          <AlertTriangle size={20} className={styles.warningIcon} />
          <div className={styles.warningContent}>
            <Typography variant="p" weight="medium">
              {t("settings.dangerZone.warningTitle")}
            </Typography>
            <Typography variant="small" color="muted">
              {t("settings.dangerZone.warningDetail")}
            </Typography>
          </div>
        </div>

        <div className={styles.actionWrapper}>
          {isRunning && (
            <p className={styles.blockHint}>
              <AlertTriangle size={14} />
              {t("settings.dangerZone.blockHint")}
            </p>
          )}
          <Button
            variant="danger"
            disabled={!canDelete}
            onClick={() => setDialogOpen(true)}
            className={styles.actionBtnWithIcon}
            size="sm"
          >
            {t("settings.dangerZone.deleteButton")}
          </Button>
        </div>
      </div>

      {/* CONFIRMATION MODAL SECTION */}
      {dialogOpen && (
        <div className={styles.overlay} onClick={() => { if (!loading) setDialogOpen(false); }}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <Typography variant="h3" weight="bold">
                {t("settings.dangerZone.dialog.title")}
              </Typography>
            </div>

            <div className={styles.dialogBody}>
              <div className={styles.dialogWarning}>
                <p>{t("settings.dangerZone.dialog.body")}</p>
              </div>

              <div className={styles.confirmField}>
                <label htmlFor="confirmName" className={styles.confirmLabel}>
                  {t("settings.dangerZone.dialog.confirmLabel")}{" "}
                  <strong>{project.displayName}</strong>{" "}
                  {t("settings.dangerZone.dialog.confirmSuffix")}
                </label>
                <Input
                  id="confirmName"
                  type="text"
                  placeholder={project.displayName}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && <p className={styles.errorText}>{error}</p>}
            </div>

            <div className={styles.dialogFooter}>
              <Button
                variant="ghost"
                onClick={() => { setDialogOpen(false); setConfirmName(""); setError(null); }}
                disabled={loading}
              >
                {t("settings.dangerZone.dialog.cancel")}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={!confirmMatch || loading}
                className={styles.actionBtnWithIcon}
              >
                {loading ? (
                  t("settings.dangerZone.dialog.deleting")
                ) : (
                  <>
                    <Trash2 size={16} />{" "}
                    {t("settings.dangerZone.dialog.deletePermanently")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
}
