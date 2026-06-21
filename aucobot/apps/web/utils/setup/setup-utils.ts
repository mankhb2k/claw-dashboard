import {
  isContainerMissing,
  isProjectBusy,
  isProjectReady,
} from "@/lib/routing/entry-route";

import type { Project } from "@/schemas/project.schema";

export type CloudSetupMode = "create" | "resume" | "recreate" | "ready";
export type OssSetupMode = "create" | "resume" | "recover" | "ready";

export function resolveCloudMode(project: Project | null): CloudSetupMode {
  if (!project) return "create";
  if (isContainerMissing(project)) return "recreate";
  if (project.status === "error") return "recreate";
  if (isProjectReady(project.status)) return "ready";
  return "resume";
}

export function resolveOssMode(project: Project | null): OssSetupMode {
  if (!project) return "create";
  if (isProjectReady(project.status)) return "ready";
  if (isProjectBusy(project.status)) return "resume";
  return "recover";
}

/** Avoid showing the same message twice (project.errorMessage + local/store error). */
export function resolveSetupError(
  project: Project | null,
  error: string | null | undefined,
): string | null {
  const message = error?.trim();
  if (!message) return null;
  const projectMessage = project?.errorMessage?.trim();
  if (projectMessage && projectMessage === message) return null;
  return message;
}
