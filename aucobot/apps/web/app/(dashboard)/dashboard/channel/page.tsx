import { getCurrentProjectId } from "@/lib/current-project";
import { ClientChannelPage } from "./_components/ClientChannelPage/ClientChannelPage";
import { Container, Flex } from "@/components/layout";
import styles from "./channel.module.css";

export default async function ChannelsPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientChannelPage projectId={projectId} />
      </Container>
    </Flex>
  );
}
