import { Container, Flex } from "@/components/layout";
import { ClientWhatsappPage } from "./_components/ClientWhatsappPage/ClientWhatsappPage";
import styles from "../channel-detail.module.css";

export default function WhatsAppChannelPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <ClientWhatsappPage />
      </Container>
    </Flex>
  );
}
