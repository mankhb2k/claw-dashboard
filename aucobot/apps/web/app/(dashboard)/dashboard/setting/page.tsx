import { Flex, Container } from "@/components/layout";
import { projectApi } from "@/lib/api/project";
import { getCurrentProject } from "@/lib/current-project";
import { ClientSettingPage } from "./_components/ClientSettingPage/ClientSettingPage";
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
          <p className={styles.error}>Project not found.</p>
        </Container>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="sm" display="flex" className={styles.content}>
        <ClientSettingPage project={project} initialHealth={initialHealth} />
      </Container>
    </Flex>
  );
}
