import { Flex, Container } from "@/components/layout/";
import { TitleHeader } from "@/components/dashboard";
import ClientAIModelPage from "./_components/ClientAIModelPage/ClientAIModelPage";
import styles from "./ai-model.module.css";

export default function Page() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <TitleHeader
          title="Kết nối AI & API Keys"
          description="Quản lý các kết nối API cho dự án của bạn."
          showBorder
        />
        <ClientAIModelPage />
      </Container>
    </Flex>
  );
}
