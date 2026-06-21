import styles from "../[agentId]/agentId.module.css";
import { ClientCreateAgentPage } from "./_components/ClientCreateAgentPage/ClientCreateAgentPage";
import { Flex, Container } from "@/components/layout";

export default function CreateAgentPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="full" display="flex" className={styles.content}>
        <ClientCreateAgentPage />
      </Container>
    </Flex>
  );
}
