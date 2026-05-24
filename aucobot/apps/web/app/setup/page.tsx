"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useProjectStore } from "@/stores/project.store";
import {
  getPrimaryProject,
  isContainerMissing,
  isProjectBusy,
  isProjectReady,
} from "@/lib/entry-route";
import { getDashboardPath } from "@/lib/dashboard-route";
import { gatewayTimeoutMessage, OSS_GATEWAY_DEV_URL } from "@/lib/oss-gateway";
import { isOssRuntime } from "@/lib/runtime-mode";
import { spawnTimeoutMessage } from "@/lib/project-spawn";
import type { Project, ProjectStatus } from "@/schemas/project.schema";
import styles from "./setup.module.css";

const setupFormSchema = z.object({
  displayName: z
    .string()
    .min(1, "Enter a workspace name")
    .max(200, "Max 200 characters"),
});

type SetupFormInput = z.infer<typeof setupFormSchema>;

type CloudSetupMode = "create" | "resume" | "recreate" | "ready";
type OssSetupMode = "create" | "resume" | "recover" | "ready";

function resolveCloudMode(project: Project | null): CloudSetupMode {
  if (!project) return "create";
  if (isContainerMissing(project)) return "recreate";
  if (project.status === "error") return "recreate";
  if (isProjectReady(project.status)) return "ready";
  return "resume";
}

function resolveOssMode(project: Project | null): OssSetupMode {
  if (!project) return "create";
  if (isProjectReady(project.status)) return "ready";
  if (isProjectBusy(project.status)) return "resume";
  return "recover";
}

function statusLabel(status: ProjectStatus, missing: boolean): string {
  if (isOssRuntime()) {
    switch (status) {
      case "creating":
        return "Preparing workspace…";
      case "starting":
        return "Connecting to gateway…";
      case "error":
        return "Setup error";
      case "running":
        return "Ready";
      default:
        return status;
    }
  }

  if (missing) return "Container removed — recreate required";
  switch (status) {
    case "creating":
      return "Creating container…";
    case "starting":
      return "Starting OpenClaw…";
    case "stopping":
      return "Stopping…";
    case "stopped":
      return "Stopped — start container";
    case "error":
      return "Runtime error";
    case "running":
      return "Ready";
    default:
      return status;
  }
}

export default function SetupPage() {
  const router = useRouter();
  const oss = isOssRuntime();
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

  const primary = useMemo(() => getPrimaryProject(projects), [projects]);
  const cloudMode = resolveCloudMode(primary);
  const ossMode = resolveOssMode(primary);
  const mode = oss ? ossMode : cloudMode;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormInput>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      displayName: user?.name?.trim() || "My Agent",
    },
  });

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (mode === "ready") {
      router.replace(getDashboardPath());
    }
  }, [mode, router]);

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

  if (mode === "ready") {
    return (
      <div className={styles.page}>
        <p className={styles.meta}>Opening dashboard…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {mode === "create" && (
          <>
            <span className={styles.badge}>Step 1 · One time</span>
            <h1 className={styles.title}>Create workspace</h1>
            <p className={styles.subtitle}>
              {oss ? (
                <>
                  The API will save your workspace and verify the shared OpenClaw gateway at{" "}
                  <strong>{OSS_GATEWAY_DEV_URL}</strong>. No per-project Docker container is
                  created.
                </>
              ) : (
                <>
                  The backend will create a project and spawn an OpenClaw Docker container.
                  Next time use <strong>Open dashboard</strong> to start it again.
                </>
              )}
            </p>
            <form className={styles.form} onSubmit={handleSubmit(onCreate)} noValidate>
              <Input
                id="displayName"
                label="Workspace name"
                placeholder="e.g. Admin"
                error={errors.displayName?.message}
                disabled={busy}
                {...register("displayName")}
              />
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.actions}>
                <Button type="submit" loading={busy} style={{ width: "100%" }}>
                  {oss ? "Create workspace" : "Create & start container"}
                </Button>
              </div>
            </form>
          </>
        )}

        {oss && mode === "recover" && primary && (
          <>
            <span className={styles.badge}>OSS · Shared gateway</span>
            <h1 className={styles.title}>Continue to dashboard</h1>
            <p className={styles.subtitle}>
              Workspace <strong>{primary.displayName}</strong> — {statusLabel(primary.status, false)}
              . Ensure the gateway container is running on port <strong>18789</strong>, then
              continue.
            </p>
            {primary.errorMessage && (
              <p className={styles.errorDetail}>{primary.errorMessage}</p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <Button
                type="button"
                loading={busy || isLoading}
                style={{ width: "100%" }}
                onClick={() => void goToDashboard()}
              >
                {busy ? "Checking gateway…" : "Continue to dashboard"}
              </Button>
            </div>
          </>
        )}

        {!oss && mode === "recreate" && primary && (
          <>
            <span className={styles.badge}>
              {primary.status === "error" ? "Spawn failed" : "Container missing"}
            </span>
            <h1 className={styles.title}>
              {primary.status === "error" ? "Respawn container" : "Recreate container"}
            </h1>
            <p className={styles.subtitle}>
              Workspace <strong>{primary.displayName}</strong>
              {primary.status === "error"
                ? " — gateway was not ready in time or Docker failed. Respawn to create a new container."
                : " — data is kept on disk, but the Docker container is gone."}
            </p>
            {primary.errorMessage && (
              <p className={styles.errorDetail}>{primary.errorMessage}</p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <Button
                type="button"
                loading={busy || isLoading}
                style={{ width: "100%" }}
                onClick={() => void handleRespawn()}
              >
                {busy ? "Spawning…" : "Respawn container"}
              </Button>
            </div>
          </>
        )}

        {mode === "resume" && primary && (
          <>
            <span className={styles.badge}>Preparing</span>
            <h1 className={styles.title}>Your workspace</h1>
            <p className={styles.subtitle}>
              <strong>{primary.displayName}</strong> — {statusLabel(primary.status, false)}
            </p>
            {!oss && (
              <div className={styles.steps}>
                <div
                  className={`${styles.step} ${primary.status === "creating" ? styles.stepActive : styles.stepDone}`}
                >
                  <span
                    className={`${styles.stepDot} ${primary.status === "creating" ? styles.stepDotActive : styles.stepDotDone}`}
                  />
                  Docker container
                </div>
                <div
                  className={`${styles.step} ${primary.status === "starting" ? styles.stepActive : primary.status === "creating" ? "" : styles.stepDone}`}
                >
                  <span
                    className={`${styles.stepDot} ${primary.status === "starting" ? styles.stepDotActive : primary.status === "running" ? styles.stepDotDone : ""}`}
                  />
                  OpenClaw gateway
                </div>
              </div>
            )}
            {primary.errorMessage && (
              <p className={styles.errorDetail}>{primary.errorMessage}</p>
            )}
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <Button
                type="button"
                loading={busy || isLoading}
                style={{ width: "100%" }}
                onClick={() => void goToDashboard()}
              >
                {busy
                  ? oss
                    ? "Waiting for gateway…"
                    : "Waiting for container…"
                  : oss
                    ? "Continue to dashboard"
                    : "Start container & open dashboard"}
              </Button>
              {!oss && (primary.status === "creating" || primary.status === "starting") && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  style={{ width: "100%" }}
                  onClick={() => void handleRespawn()}
                >
                  Respawn (if stuck over 1 min)
                </Button>
              )}
            </div>
          </>
        )}

        <p className={styles.meta}>
          {oss ? (
            <>
              OSS uses one shared gateway (<code>docker compose -f deploy/docker-compose.gateway.dev.yml</code>
              ). Per-project spawn is not used.
            </>
          ) : (
            <>
              Project is created once. Stopped container → <strong>start</strong>. Missing
              container → <strong>respawn</strong>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
