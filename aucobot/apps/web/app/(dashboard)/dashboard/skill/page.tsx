import { ClientSkillPage } from "./_components/ClientSkillPage/ClientSkillPage";
import { Container, Flex } from "@/components/layout";
import { TitleHeader } from "@/components/dashboard";
import styles from "./skill.module.css";

export default function ProjectSkillDirectoryPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <TitleHeader
          title="Danh sách Kỹ năng (Skills)"
          description="Quản lý các kỹ năng cho dự án của bạn."
          showBorder
        />
        <ClientSkillPage />
      </Container>
    </Flex>
  );
}
