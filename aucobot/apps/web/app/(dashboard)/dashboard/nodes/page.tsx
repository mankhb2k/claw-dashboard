import { getCurrentProjectId } from "@/lib/current-project";
import { Container, Flex } from "@/components/layout";
import { TitleHeader } from "@/components/dashboard";
import ClientNodesPage from "./_components/ClientNodesPage/ClientNodesPage";
import styles from "./nodes.module.css";

export default async function NodesPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <TitleHeader
          title="Companion Nodes"
          badge="BETA"
          description="Create  invite, connect OpenClaw Node and approve companion devices with gateway."
          showBorder
        />
        <ClientNodesPage projectId={projectId} />
      </Container>
    </Flex>
  );
}
