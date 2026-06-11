"use client";

import type { Project, ProjectHealth } from "@/schemas/project.schema";
import { DangerZone } from "../DangerZone/DangerZone";
import { GatewayStatusSection } from "../GatewayStatusSection/GatewayStatusSection";
import { GeneralSection } from "../GeneralSection/GeneralSection";
import { SandboxSection } from "../SandboxSection/SandboxSection";
import { ShellExecSection } from "../ShellExecSection/ShellExecSection";
import styles from "../../setting.module.css";

interface ClientSettingPageProps {
  project: Project;
  initialHealth: ProjectHealth | null;
}

export function ClientSettingPage({
  project,
  initialHealth,
}: ClientSettingPageProps) {
  const projectId = project.id;

  return (
    <div className={styles.sections}>
      <GeneralSection project={project} />
      <SandboxSection projectId={projectId} />
      <ShellExecSection projectId={projectId} />
      <GatewayStatusSection
        projectId={projectId}
        subdomain={project.subdomain}
        initialHealth={initialHealth}
      />
      <DangerZone project={project} />
    </div>
  );
}
