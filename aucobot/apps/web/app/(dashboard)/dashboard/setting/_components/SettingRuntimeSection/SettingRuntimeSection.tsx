"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Typography, Spinner } from "@/components/ui";
import { Flex } from "@/components/layout";
import { Play, Square, RotateCw } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectHealth, ProjectStatus } from "@/schemas/project.schema";
import styles from "./SettingRuntimeSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
  initialHealth: ProjectHealth | null;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  creating: "Đang tạo",
  running: "Đang chạy",
  starting: "Đang khởi động",
  stopping: "Đang dừng",
  stopped: "Đã dừng",
  error: "Lỗi",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  creating: "yellow",
  running: "green",
  starting: "yellow",
  stopping: "yellow",
  stopped: "gray",
  error: "red",
};

export function SettingRuntimeSection({ projectId, initialHealth }: Props) {
  const [health, setHealth] = useState<ProjectHealth | null>(initialHealth);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startProject = useProjectStore((s) => s.startProject);
  const respawnProject = useProjectStore((s) => s.respawnProject);
  const stopProject = useProjectStore((s) => s.stopProject);
  const clearHealthPoll = useProjectStore((s) => s.clearHealthPoll);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const h = await projectApi.health(projectId);
      setHealth(h);
      return h;
    } catch {
      return null;
    }
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearHealthPoll(projectId);
    };
  }, [projectId, clearHealthPoll]);

  useEffect(() => {
    const status = health?.status;
    const busy =
      status === "starting" || status === "stopping" || status === "creating";
    if (!busy) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      const h = await fetchHealth();
      if (
        h &&
        h.status !== "starting" &&
        h.status !== "stopping" &&
        h.status !== "creating"
      ) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setActionLoading(false);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [health?.status, fetchHealth]);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleStart = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await startProject(projectId);
      const h = await fetchHealth();
      if (h?.status === "running") {
        setActionLoading(false);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Không thể khởi động container.");
      setActionLoading(false);
    }
  };

  const handleRespawn = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await respawnProject(projectId);
      const h = await fetchHealth();
      if (h?.status === "running") {
        setActionLoading(false);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Không thể spawn lại container.");
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await stopProject(projectId);
      const h = await fetchHealth();
      if (h?.status === "stopped") {
        setActionLoading(false);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Không thể dừng container.");
      setActionLoading(false);
    }
  };

  const status = health?.status ?? "stopped";
  const statusClass = STATUS_CLASS[status];
  const isTransitioning = status === "starting" || status === "stopping" || status === "creating";
  const containerMissing = health?.containerMissing === true;
  const serverError = health?.errorMessage?.trim() || null;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "clawsandbox.cloud";
  const gatewayUrl = health?.publicUrl ?? (health?.subdomain ? `https://${health.subdomain}.${appDomain}` : null);

  const lastActiveText = health?.lastActiveAt
    ? new Date(health.lastActiveAt).toLocaleString("vi-VN")
    : "—";

  const storageUsed = health?.storageUsedMb ?? 0;
  const storageQuota = 4096; // Free = 4GB
  const storagePercent = Math.min((storageUsed / storageQuota) * 100, 100);

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title="Project status" />

      <CardSection>
        {/* Status Row */}
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">Trạng thái Container</Typography>
            <Typography variant="small" color="muted">
              Trạng thái hiện tại của gateway worker.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <div className={styles.statusDisplay}>
              <div className={styles.statusInfo}>
                <span className={`${styles.statusDot} ${styles[`dot_${statusClass}`]}`} />
                <Typography variant="p" weight="bold">
                  {STATUS_LABEL[status]}
                </Typography>
                {isTransitioning && <Spinner size="sm" />}
              </div>
              <div className={styles.actionBtns}>
                {status === "stopped" && (
                  <Button
                    variant="primary"
                    onClick={handleStart}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <Play size={14} fill="currentColor" />
                    Khởi động
                  </Button>
                )}
                {status === "running" && (
                  <Button
                    variant="ghost"
                    onClick={handleStop}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <Square size={14} fill="currentColor" />
                    Dừng
                  </Button>
                )}
                {isTransitioning && (
                  <Button variant="ghost" disabled size="sm">
                    Đang xử lý...
                  </Button>
                )}
                {(status === "error" || containerMissing) && (
                  <Button
                    variant="primary"
                    onClick={handleRespawn}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <RotateCw size={14} />
                    Spawn lại
                  </Button>
                )}
                {status === "error" && !containerMissing && (
                  <Button
                    variant="ghost"
                    onClick={handleStart}
                    disabled={actionLoading}
                    className={styles.actionBtnWithIcon}
                    size="sm"
                  >
                    <Play size={14} />
                    Start
                  </Button>
                )}
              </div>
            </div>
            {(errorMsg || serverError) && (
              <p className={styles.errorMsg}>{errorMsg ?? serverError}</p>
            )}
          </CardSection.Action>
        </CardSection.Row>

        {/* Domain Row */}
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">Domain URL</Typography>
            <Typography variant="small" color="muted">
              Địa chỉ truy cập công khai của dự án.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            {gatewayUrl ? (
              <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className={styles.statLink}>
                {gatewayUrl.replace("https://", "")} ↗
              </a>
            ) : (
              <span className={styles.statValue}>—</span>
            )}
          </CardSection.Action>
        </CardSection.Row>

        {/* Storage Row */}
        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">Dung lượng lưu trữ</Typography>
            <Typography variant="small" color="muted">
              Không gian lưu trữ đã sử dụng trên tổng định mức.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <div className={styles.storageBar}>
              <div className={styles.storageTrack}>
                <div
                  className={styles.storageFill}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <span className={styles.storageText}>
                {storageUsed.toFixed(0)} MB / {(storageQuota / 1024).toFixed(0)} GB ({storagePercent.toFixed(1)}%)
              </span>
            </div>
          </CardSection.Action>
        </CardSection.Row>
      </CardSection>
    </Flex>
  );
}

