import { ClientSkillPage } from "./_components/ClientSkillPage/ClientSkillPage";
import { Container, Flex } from "@/components/layout";
import styles from "./skill.module.css";

export default function ProjectSkillDirectoryPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <ClientSkillPage />
      </Container>
    </Flex>
  );
}
