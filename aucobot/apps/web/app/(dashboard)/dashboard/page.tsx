import { Container, Flex } from "@/components/layout";
import { TitleHeader } from "@/components/dashboard";
import { ClientOverviewPage } from "./_components/ClientOverviewPage/ClientOverviewPage";
import styles from "./overview.module.css";

export default function ProjectOverviewPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <ClientOverviewPage />
      </Container>
    </Flex>
  );
}
