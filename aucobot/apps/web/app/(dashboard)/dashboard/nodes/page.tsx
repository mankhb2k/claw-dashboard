import { getCurrentProjectId } from "@/lib/current-project";
import { Container, Flex } from "@/components/layout";
import ClientNodesPage from "./_components/ClientNodesPage/ClientNodesPage";
import styles from "./nodes.module.css";

export default async function NodesPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientNodesPage projectId={projectId} />
      </Container>
    </Flex>
  );
}
