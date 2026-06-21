import { ClientAIModelPage } from "./_components/ClientAIModelPage/ClientAIModelPage";
import styles from "./ai-model.module.css";
import { Flex, Container } from "@/components/layout/";

export default function Page() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientAIModelPage />
      </Container>
    </Flex>
  );
}
