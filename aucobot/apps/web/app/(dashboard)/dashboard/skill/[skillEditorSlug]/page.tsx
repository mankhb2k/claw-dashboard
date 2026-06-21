import { ClientSkillEditorPage } from "./_components/ClientSkillEditorPage/ClientSkillEditorPage";
import styles from "./skillEditorSlug.module.css";
import { Flex, Container } from "@/components/layout";

export default function ProjectSkillEditorPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="full" display="flex" className={styles.content}>
        <ClientSkillEditorPage />
      </Container>
    </Flex>
  );
}
