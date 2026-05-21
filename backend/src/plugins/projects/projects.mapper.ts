import { Project, ProjectStatus } from '@prisma/client';

export type ProjectDto = {
  id: string;
  displayName: string;
  subdomain: string;
  publicUrl?: string;
  status: string;
  containerName: string | null;
  /** Docker container đã mất — cần spawn lại, không tạo project mới. */
  containerMissing: boolean;
  errorMessage: string | null;
  lastActiveAt: string | null;
  createdAt: string;
};

function statusLower(s: ProjectStatus): string {
  return s.toLowerCase();
}

export function toProjectDto(
  project: Project,
  opts?: { appDomain?: string; containerMissing?: boolean },
): ProjectDto {
  const domain = opts?.appDomain ?? process.env.APP_DOMAIN ?? 'localhost';
  const publicUrl =
    project.hostPort && project.status === ProjectStatus.RUNNING
      ? `http://127.0.0.1:${project.hostPort}`
      : project.subdomain
        ? `https://${project.subdomain}.${domain}`
        : undefined;

  const containerMissing =
    opts?.containerMissing ??
    (!project.containerId ||
      project.errorMessage === 'Container not found' ||
      project.errorMessage === 'No container to start');

  return {
    id: project.id,
    displayName: project.displayName,
    subdomain: project.subdomain,
    publicUrl,
    status: statusLower(project.status),
    containerName: project.containerName,
    containerMissing,
    errorMessage: project.errorMessage,
    lastActiveAt: project.lastActiveAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
  };
}
