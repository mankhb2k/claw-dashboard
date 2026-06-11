import { Container, Flex } from "@/components/layout";
import { getCurrentProjectId } from "@/lib/current-project";
import { ClientDiscordPage } from "./_components/ClientDiscordPage/ClientDiscordPage";
import styles from "../channel-detail.module.css";

export default async function DiscordSetupPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientDiscordPage projectId={projectId} />
      </Container>
    </Flex>
  );
}
