import { Flex, Container } from "@/components/layout";
import { projectApi } from "@/lib/api/project";
import { getCurrentProject } from "@/lib/current-project";
import { GeneralSection } from "./_components/GeneralSection/GeneralSection";
import { GatewayStatusSection } from "./_components/GatewayStatusSection/GatewayStatusSection";
import { SandboxSection } from "./_components/SandboxSection/SandboxSection";
import { ShellExecSection } from "./_components/ShellExecSection/ShellExecSection";
import { DangerZone } from "./_components/DangerZone/DangerZone";
import styles from "./setting.module.css";

export default async function ProjectSettingPage() {
  const project = await getCurrentProject();
  const id = project?.id ?? "";

  let initialHealth: Awaited<ReturnType<typeof projectApi.health>> | null =
    null;
  if (id) {
    try {
      initialHealth = await projectApi.health(id);
    } catch {
      // client may retry
    }
  }

  if (!project) {
    return (
      <Flex direction="column" align="stretch" className={styles.page}>
        <Container size="sm" className={styles.content}>
          <p className={styles.error}>Không tìm thấy dự án.</p>
        </Container>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="sm" display="flex" className={styles.content}>
        <div className={styles.sections}>
          <GeneralSection project={project} />

          <SandboxSection projectId={id} />
          <ShellExecSection projectId={id} />
          <GatewayStatusSection
            projectId={id}
            subdomain={project.subdomain}
            initialHealth={initialHealth}
          />
          <DangerZone project={project} />
        </div>
      </Container>
    </Flex>
  );
}
