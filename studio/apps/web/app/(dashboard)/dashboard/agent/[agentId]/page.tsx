import { ClientAgentIdPage } from "./_components/ClientAgentIdPage/ClientAgentIdPage";
import styles from "./agentId.module.css";
import { Flex, Container } from "@/components/layout";

interface PageProps {
  params: Promise<{
    agentId: string;
  }>;
}

export default async function EditAgentPage({ params }: PageProps) {
  const { agentId } = await params;
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="full" display="flex" className={styles.content}>
        <ClientAgentIdPage agentId={agentId} />
      </Container>
    </Flex>
  );
}
