import styles from "../channel-detail.module.css";
import { ClientTelegramPage } from "./_components/ClientTelegramPage/ClientTelegramPage";
import { Container, Flex } from "@/components/layout";
import { getCurrentProjectId } from "@/lib/current-project";

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
