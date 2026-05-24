import Link from "next/link";
import { Container, Flex } from "@/components/layout";
import { Typography } from "@/components/ui";
import styles from "../telegram/telegram.module.css";

export default function WhatsAppChannelPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <Flex direction="column" gap={4}>
          <Link href="/dashboard/channel">← Quay lại danh sách kênh</Link>
          <Typography variant="h2" as="h1">
            WhatsApp
          </Typography>
          <Typography variant="p" color="muted">
            Kênh này chưa được hỗ trợ trên bản OSS hiện tại. Vui lòng dùng Telegram hoặc chờ bản
            cập nhật sau.
          </Typography>
        </Flex>
      </Container>
    </Flex>
  );
}
