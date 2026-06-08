import { Flex, Container } from "@/components/layout";
import { ClientSkillEditorPage } from "./_components/ClientSkillEditorPage/ClientSkillEditorPage";
import styles from "./skillEditorSlug.module.css";

export default function ProjectSkillEditorPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="full" display="flex" className={styles.content}>
        <ClientSkillEditorPage />
      </Container>
    </Flex>
  );
}
