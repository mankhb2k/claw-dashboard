import { ClientOverviewPage } from "./_components/ClientOverviewPage/ClientOverviewPage";
import styles from "./overview.module.css";
import { Container, Flex } from "@/components/layout";

export default function ProjectOverviewPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <ClientOverviewPage />
      </Container>
    </Flex>
  );
}
