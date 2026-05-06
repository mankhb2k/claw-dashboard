import type { Project } from "@/schemas/project.schema";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

export function getUserSlug(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return "user";
  return slugify(
    nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail,
  );
}

export function getProjectSegment(
  project: Pick<Project, "id" | "displayName" | "name">,
): string {
  const label = project.displayName || project.name || "project";
  return `${slugify(label)}-${project.id}`;
}

/** Prefix URL chi tiết project: `/project/{slug}-{id}` */
export function getProjectOverviewPath(
  project: Pick<Project, "id" | "displayName" | "name">,
): string {
  return `/project/${getProjectSegment(project)}`;
}

export function getProjectSettingPath(
  project: Pick<Project, "id" | "displayName" | "name">,
): string {
  return `${getProjectOverviewPath(project)}/setting`;
}

export function getProjectModelPath(
  project: Pick<Project, "id" | "displayName" | "name">,
): string {
  return `${getProjectOverviewPath(project)}/model`;
}

export function extractProjectIdFromSegment(segment: string): string {
  const trimmed = (segment ?? "").trim();
  if (!trimmed) return "";
  const idx = trimmed.lastIndexOf("-");
  if (idx === -1) return trimmed;
  return trimmed.slice(idx + 1);
}
