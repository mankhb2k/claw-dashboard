import { Container, Flex } from "@/components/layout";
import { Typography } from "@/components/ui";
import { BackButton } from "@/components/dashboard";
import styles from "../telegram/telegram.module.css";

export default function WhatsAppChannelPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <Flex direction="column" gap={4}>
          <BackButton href="/dashboard/channel">WhatsApp</BackButton>
          <Typography variant="p" color="muted">
            Kênh này chưa được hỗ trợ trên bản OSS hiện tại. Vui lòng dùng Telegram hoặc chờ bản
            cập nhật sau.
          </Typography>
        </Flex>
      </Container>
    </Flex>
  );
}
