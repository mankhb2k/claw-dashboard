"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flex } from "@/components/layout";
import { Button, Input, Typography } from "@/components/ui";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useProjectStore } from "@/stores/project.store";
import type { Project } from "@/schemas/project.schema";
import styles from "./SettingDangerZone.module.css";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  project: Project;
}

export function SettingDangerZone({ project }: Props) {
  /* 1. STATE & HOOKS */
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
      setError(e instanceof Error ? e.message : "Không thể xóa dự án. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  /* 4. RENDER */
  return (
    <Flex direction="column" gap={24}>
      {/* HEADER SECTION */}
      <TitleSection
        title="Delete project"
        description="Permanently remove your project and its database"
      />

      {/* DANGER CARD SECTION */}
      <div className={styles.card}>
        <div className={styles.warningContentWrapper}>
          <AlertTriangle size={20} className={styles.warningIcon} />
          <div className={styles.warningContent}>
            <Typography variant="p" weight="medium">
              Deleting this project will also remove your database.
            </Typography>
            <Typography variant="small" color="muted">
              Make sure you have made a backup if you want to keep your data.
            </Typography>
          </div>
        </div>

        <div className={styles.actionWrapper}>
          {isRunning && (
            <p className={styles.blockHint}>
              <AlertTriangle size={14} />
              Dừng container trước khi xóa.
            </p>
          )}
          <Button
            variant="danger"
            disabled={!canDelete}
            onClick={() => setDialogOpen(true)}
            className={styles.actionBtnWithIcon}
            size="sm"
          >
            Delete project
          </Button>
        </div>
      </div>

      {/* CONFIRMATION MODAL SECTION */}
      {dialogOpen && (
        <div className={styles.overlay} onClick={() => { if (!loading) setDialogOpen(false); }}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <Typography variant="h3" weight="bold">Xác nhận xóa dự án?</Typography>
            </div>

            <div className={styles.dialogBody}>
              <div className={styles.dialogWarning}>
                <p>
                  Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ dữ liệu, channel kết nối, kỹ năng và cấu hình của dự án sẽ bị xóa vĩnh viễn.
                </p>
              </div>

              <div className={styles.confirmField}>
                <label htmlFor="confirmName" className={styles.confirmLabel}>
                  Nhập tên dự án <strong>{project.displayName}</strong> để xác nhận:
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
                Huỷ
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={!confirmMatch || loading}
                className={styles.actionBtnWithIcon}
              >
                {loading ? "Đang xóa..." : <><Trash2 size={16} /> Xóa vĩnh viễn</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Flex>
  );
}
