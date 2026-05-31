"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";
import {
  getPrimaryProject,
  isContainerMissing,
  isProjectBusy,
  isProjectReady,
  shouldRedirectToSetup,
} from "@/lib/entry-route";
import { getDashboardPath } from "@/lib/dashboard-route";
import { gatewayTimeoutMessage } from "@/lib/oss-gateway";
import { spawnTimeoutMessage } from "@/lib/project-spawn";
import type { SetupFormInput } from "@/schemas/setup.schema";
import { resolveCloudMode, resolveOssMode } from "../setup-utils";
import { SetupCreateForm } from "../SetupCreateForm/SetupCreateForm";
import { SetupOssRecover } from "../SetupOssRecover/SetupOssRecover";
import { SetupCloudRecreate } from "../SetupCloudRecreate/SetupCloudRecreate";
import { SetupResume } from "../SetupResume/SetupResume";
import { Flex } from "@/components/layout";
import { Card, Typography } from "@/components/ui";
import { SetupFooterMeta } from "../SetupFooterMeta/SetupFooterMeta";

interface ClientSetupPageProps {
  oss: boolean;
}

export function ClientSetupPage({ oss }: ClientSetupPageProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const createProject = useProjectStore((s) => s.createProject);
  const startProject = useProjectStore((s) => s.startProject);
  const respawnProject = useProjectStore((s) => s.respawnProject);
  const pollHealth = useProjectStore((s) => s.pollHealth);
  const projects = useProjectStore((s) => s.projects);
  const storeError = useProjectStore((s) => s.error);
  const isLoading = useProjectStore((s) => s.isLoading);

  const [localError, setLocalError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const autoEnterDoneRef = useRef(false);

  const primary = useMemo(() => getPrimaryProject(projects), [projects]);
  const cloudMode = resolveCloudMode(primary);
  const ossMode = resolveOssMode(primary);
  const mode = oss ? ossMode : cloudMode;
  const canEnterDashboard =
    bootstrapped && primary !== null && !shouldRedirectToSetup(primary);

  useEffect(() => {
    void fetchProjects().finally(() => setBootstrapped(true));
  }, [fetchProjects]);

  useEffect(() => {
    if (!canEnterDashboard || autoEnterDoneRef.current || isProvisioning) return;
    autoEnterDoneRef.current = true;
    router.replace(getDashboardPath());
  }, [canEnterDashboard, isProvisioning, router]);

  useEffect(() => {
    if (!oss || !primary || canEnterDashboard) return;
    const stop = pollHealth(primary.id, () => {
      void fetchProjects({ silent: true });
    });
    return () => stop();
  }, [oss, primary?.id, primary?.status, canEnterDashboard, pollHealth, fetchProjects]);

  const retryGatewayCheck = useCallback(() => {
    const current = getPrimaryProject(useProjectStore.getState().projects);
    if (!current || isProvisioning) return;
    setLocalError(null);
    setIsProvisioning(true);
    const stop = pollHealth(current.id, () => {
      stop();
      void fetchProjects({ silent: true }).finally(() => setIsProvisioning(false));
    });
  }, [pollHealth, fetchProjects, isProvisioning]);

  const waitUntilRunning = useCallback(
    (projectId: string) =>
      new Promise<boolean>((resolve) => {
        const stop = pollHealth(projectId, () => {
          stop();
          const latest = getPrimaryProject(useProjectStore.getState().projects);
          resolve(latest ? isProjectReady(latest.status) && !isContainerMissing(latest) : false);
        });
      }),
    [pollHealth],
  );

  const spawnAndEnter = useCallback(
    async (projectId: string, action: "respawn" | "start") => {
      if (action === "respawn") {
        await respawnProject(projectId);
      } else {
        await startProject(projectId);
      }
      await fetchProjects({ silent: true });
      const ok = await waitUntilRunning(projectId);
      if (ok) {
        router.push(getDashboardPath());
      } else {
        const latest = getPrimaryProject(useProjectStore.getState().projects);
        setLocalError(
          latest?.errorMessage?.trim() ||
            (oss ? gatewayTimeoutMessage() : spawnTimeoutMessage()),
        );
      }
    },
    [oss, respawnProject, startProject, fetchProjects, waitUntilRunning, router],
  );

  const goToDashboard = useCallback(async () => {
    if (isProvisioning) return;
    setLocalError(null);
    const current = getPrimaryProject(useProjectStore.getState().projects);
    if (!current) {
      setLocalError("No workspace yet. Create a project first.");
      return;
    }

    if (isProjectReady(current.status) && !isContainerMissing(current)) {
      router.push(getDashboardPath());
      return;
    }

    if (oss) {
      setIsProvisioning(true);
      try {
        await fetchProjects({ silent: true });
        const ok = await waitUntilRunning(current.id);
        if (ok) {
          router.push(getDashboardPath());
        } else {
          const latest = getPrimaryProject(useProjectStore.getState().projects);
          setLocalError(
            latest?.errorMessage?.trim() ||
              (oss ? gatewayTimeoutMessage() : spawnTimeoutMessage()),
          );
        }
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Could not open dashboard");
      } finally {
        setIsProvisioning(false);
      }
      return;
    }

    setIsProvisioning(true);
    try {
      const needsRespawn =
        isContainerMissing(current) ||
        current.status === "error" ||
        current.status === "creating";
      await spawnAndEnter(current.id, needsRespawn ? "respawn" : "start");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not open dashboard");
    } finally {
      setIsProvisioning(false);
    }
  }, [oss, router, spawnAndEnter, isProvisioning, fetchProjects, waitUntilRunning]);

  const handleRespawn = useCallback(async () => {
    const current = getPrimaryProject(useProjectStore.getState().projects);
    if (!current || isProvisioning) return;
    setLocalError(null);
    setIsProvisioning(true);
    try {
      await spawnAndEnter(current.id, "respawn");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Respawn failed");
    } finally {
      setIsProvisioning(false);
    }
  }, [spawnAndEnter, isProvisioning]);

  const onCreate = async (data: SetupFormInput) => {
    setLocalError(null);
    setIsProvisioning(true);
    try {
      const project = await createProject({
        displayName: data.displayName.trim(),
      });
      const ok = await waitUntilRunning(project.id);
      if (ok) {
        router.push(getDashboardPath());
      } else {
        await fetchProjects({ silent: true });
        const latest = getPrimaryProject(useProjectStore.getState().projects);
        setLocalError(
          latest?.errorMessage?.trim() ||
            (oss ? gatewayTimeoutMessage() : spawnTimeoutMessage()),
        );
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not create workspace");
    } finally {
      setIsProvisioning(false);
    }
  };

  const busy = isProvisioning || (primary ? isProjectBusy(primary.status) : false);
  const error = localError ?? storeError;

  if (canEnterDashboard) {
    return (
      <Typography variant="small" color="muted" style={{ textAlign: "center" }}>
        Opening dashboard…
      </Typography>
    );
  }

  return (
    <Card disableHover width="100%">
      {mode === "create" && (
        <SetupCreateForm
          oss={oss}
          busy={busy}
          error={error}
          defaultDisplayName={user?.name?.trim() || "My Agent"}
          onCreate={onCreate}
        />
      )}

      {oss && mode === "recover" && primary && (
        <SetupOssRecover
          primary={primary}
          busy={busy}
          isLoading={isLoading}
          error={error}
          onContinue={() => void goToDashboard()}
          onRetryGateway={() => retryGatewayCheck()}
        />
      )}

      {!oss && mode === "recreate" && primary && (
        <SetupCloudRecreate
          primary={primary}
          busy={busy}
          isLoading={isLoading}
          error={error}
          onRespawn={() => void handleRespawn()}
        />
      )}

      {mode === "resume" && primary && (
        <SetupResume
          primary={primary}
          oss={oss}
          busy={busy}
          isLoading={isLoading}
          error={error}
          onGoToDashboard={() => void goToDashboard()}
          onRespawn={() => void handleRespawn()}
          onRetryGateway={oss ? () => retryGatewayCheck() : undefined}
        />
      )}

      <SetupFooterMeta oss={oss} />
    </Card>
  );
}
