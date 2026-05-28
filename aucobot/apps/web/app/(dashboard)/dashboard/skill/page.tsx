import { ClientSkillPage } from "./_components/ClientSkillPage/ClientSkillPage";
import { Container, Flex } from "@/components/layout";
import { TitleHeader } from "@/components/dashboard";
import styles from "./skill.module.css";

export default function ProjectSkillDirectoryPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <TitleHeader
          title="Skill Directory"
          description="Manage and design intelligent AI agents for your projects."
          showBorder
        />
        <ClientSkillPage />
      </Container>
    </Flex>
  );
}
