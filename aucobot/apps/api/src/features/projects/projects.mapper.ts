import { resolveOssGatewayHttpBase } from './runtime/gateway-endpoint';
import { isOssRuntime } from './runtime/runtime-mode';
import { ProjectStatus } from '@aucobot/database';

import type { Project } from '@aucobot/database';

export type ProjectDto = {
  id: string;
  displayName: string;
  subdomain: string;
  publicUrl?: string;
  status: string;
  containerName: string | null;
  /** Not used in self-host builds — always false. */
  containerMissing: boolean;
  errorMessage: string | null;
  lastActiveAt: string | null;
  createdAt: string;
};

function statusLower(s: ProjectStatus): string {
  return s.toLowerCase();
}

export function toProjectDto(project: Project): ProjectDto {
  const publicUrl =
    project.status === ProjectStatus.RUNNING
      ? isOssRuntime()
        ? resolveOssGatewayHttpBase()
        : undefined
      : undefined;

  return {
    id: project.id,
    displayName: project.displayName,
    subdomain: project.subdomain,
    publicUrl,
    status: statusLower(project.status),
    containerName: null,
    containerMissing: false,
    errorMessage: project.errorMessage,
    lastActiveAt: project.lastActiveAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
  };
}
