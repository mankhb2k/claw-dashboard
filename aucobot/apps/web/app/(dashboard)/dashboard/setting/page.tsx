import { Flex, Container } from "@/components/layout";
import { projectApi } from "@/lib/api/project";
import { getCurrentProject } from "@/lib/current-project";
import { SettingGeneralSection } from "./_components/SettingGeneralSection/SettingGeneralSection";
import { SettingRuntimeSection } from "./_components/SettingRuntimeSection/SettingRuntimeSection";
import { SettingSandboxSection } from "./_components/SettingSandboxSection/SettingSandboxSection";
import { SettingExecSection } from "./_components/SettingExecSection/SettingExecSection";
import { SettingGatewaySection } from "./_components/SettingGatewaySection/SettingGatewaySection";
import { SettingDangerZone } from "./_components/SettingDangerZone/SettingDangerZone";
import styles from "./setting.module.css";

export default async function ProjectSettingPage() {
  const project = await getCurrentProject();
  const id = project?.id ?? "";

  let initialHealth: Awaited<ReturnType<typeof projectApi.health>> | null = null;
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
          <SettingGeneralSection project={project} />
          <SettingRuntimeSection projectId={id} initialHealth={initialHealth} />
          <SettingSandboxSection projectId={id} />
          <SettingExecSection projectId={id} />
          <SettingGatewaySection projectId={id} subdomain={project.subdomain} />
          <SettingDangerZone project={project} />
        </div>
      </Container>
    </Flex>
  );
}
