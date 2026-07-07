"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./ClientSetupPage.module.css";
import { SetupCreateForm } from "../SetupCreateForm/SetupCreateForm";
import { SetupFooterMeta } from "../SetupFooterMeta/SetupFooterMeta";
import { SetupOssRecover } from "../SetupOssRecover/SetupOssRecover";
import { SetupResume } from "../SetupResume/SetupResume";
import { Card, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getDashboardPath } from "@/lib/routing/dashboard-route";
import {
  getPrimaryProject,
  isProjectBusy,
  isProjectReady,
  shouldRedirectToSetup,
} from "@/lib/routing/entry-route";
import { useProjectStore } from "@/stores/project.store";
import {
  gatewayTimeoutErrorKey,
  SETUP_ERROR_KEYS,
} from "@/utils/setup/setup-i18n";
import { resolveOssMode, resolveSetupError } from "@/utils/setup/setup-utils";

export function ClientSetupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const syncProjectHealth = useProjectStore((s) => s.syncProjectHealth);
  const createProject = useProjectStore((s) => s.createProject);
  const pollHealth = useProjectStore((s) => s.pollHealth);
  const projects = useProjectStore((s) => s.projects);
  const storeError = useProjectStore((s) => s.error);
  const isLoading = useProjectStore((s) => s.isLoading);

  const [localError, setLocalError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const autoEnterDoneRef = useRef(false);

  const primary = useMemo(() => getPrimaryProject(projects), [projects]);
  const mode = resolveOssMode(primary);
  const canEnterDashboard =
    bootstrapped && primary !== null && !shouldRedirectToSetup(primary);

  const timeoutErrorKey = gatewayTimeoutErrorKey();

  useEffect(() => {
    void (async () => {
      try {
        await fetchProjects();
        const current = getPrimaryProject(useProjectStore.getState().projects);
        if (current) {
          await syncProjectHealth(current.id);
        }
      } finally {
        setBootstrapped(true);
      }
    })();
  }, [fetchProjects, syncProjectHealth]);

  useEffect(() => {
    if (!canEnterDashboard || autoEnterDoneRef.current || isProvisioning)
      return;
    autoEnterDoneRef.current = true;
    router.replace(getDashboardPath());
  }, [canEnterDashboard, isProvisioning, router]);

  const primaryId = primary?.id;

  useEffect(() => {
    if (!primaryId || canEnterDashboard) return undefined;
    const stop = pollHealth(primaryId, () => {
      void fetchProjects({ silent: true });
    });
    return () => stop();
  }, [primaryId, canEnterDashboard, pollHealth, fetchProjects]);

  const retryGatewayCheck = useCallback(() => {
    const current = getPrimaryProject(useProjectStore.getState().projects);
    if (!current || isProvisioning) return;
    setLocalError(null);
    setIsProvisioning(true);
    const stop = pollHealth(current.id, () => {
      stop();
      void fetchProjects({ silent: true }).finally(() =>
        setIsProvisioning(false),
      );
    });
  }, [pollHealth, fetchProjects, isProvisioning]);

  const waitUntilRunning = useCallback(
    (projectId: string) =>
      new Promise<boolean>((resolve) => {
        const stop = pollHealth(projectId, () => {
          stop();
          const latest = getPrimaryProject(useProjectStore.getState().projects);
          resolve(latest ? isProjectReady(latest.status) : false);
        });
      }),
    [pollHealth],
  );

  const goToDashboard = useCallback(async () => {
    if (isProvisioning) return;
    setLocalError(null);
    const current = getPrimaryProject(useProjectStore.getState().projects);
    if (!current) {
      setLocalError(SETUP_ERROR_KEYS.noWorkspace);
      return;
    }

    if (isProjectReady(current.status)) {
      router.push(getDashboardPath());
      return;
    }

    setIsProvisioning(true);
    try {
      await fetchProjects({ silent: true });
      const ok = await waitUntilRunning(current.id);
      if (ok) {
        router.push(getDashboardPath());
      } else {
        const latest = getPrimaryProject(useProjectStore.getState().projects);
        setLocalError(latest?.errorMessage?.trim() || timeoutErrorKey);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : SETUP_ERROR_KEYS.openDashboard,
      );
    } finally {
      setIsProvisioning(false);
    }
  }, [
    router,
    isProvisioning,
    fetchProjects,
    waitUntilRunning,
    timeoutErrorKey,
  ]);

  const onCreate = async () => {
    setLocalError(null);
    setIsProvisioning(true);
    try {
      const project = await createProject();
      const ok = await waitUntilRunning(project.id);
      if (ok) {
        router.push(getDashboardPath());
      } else {
        await fetchProjects({ silent: true });
        const latest = getPrimaryProject(useProjectStore.getState().projects);
        setLocalError(latest?.errorMessage?.trim() || timeoutErrorKey);
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : SETUP_ERROR_KEYS.createWorkspace,
      );
      await fetchProjects({ silent: true });
    } finally {
      setIsProvisioning(false);
    }
  };

  const busy =
    isProvisioning || (primary ? isProjectBusy(primary.status) : false);
  const error = resolveSetupError(primary, localError ?? storeError);

  if (canEnterDashboard) {
    return (
      <Typography variant="small" color="muted" className={styles.opening}>
        {t("setup.opening")}
      </Typography>
    );
  }

  return (
    <Card disableHover width="100%">
      {mode === "create" && (
        <SetupCreateForm
          busy={busy}
          error={error}
          onCreate={() => void onCreate()}
        />
      )}

      {mode === "recover" && primary && (
        <SetupOssRecover
          primary={primary}
          busy={busy}
          isLoading={isLoading}
          onContinue={() => void goToDashboard()}
          onCheckGateway={() => retryGatewayCheck()}
        />
      )}

      {mode === "resume" && primary && (
        <SetupResume
          primary={primary}
          busy={busy}
          isLoading={isLoading}
          error={error}
          onGoToDashboard={() => void goToDashboard()}
          onRetryGateway={() => retryGatewayCheck()}
        />
      )}

      <SetupFooterMeta />
    </Card>
  );
}
