import { Container, Flex } from "@/components/layout";
import { getCurrentProjectId } from "@/lib/current-project";
import { ClientTelegramPage } from "./_components/ClientTelegramPage/ClientTelegramPage";
import styles from "../channel-detail.module.css";

export default async function TelegramSetupPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientTelegramPage projectId={projectId} />
      </Container>
    </Flex>
  );
}
