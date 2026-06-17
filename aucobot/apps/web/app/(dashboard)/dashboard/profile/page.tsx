import { Container, Flex } from "@/components/layout";
import { ClientProfilePage } from "./_components/ClientProfilePage/ClientProfilePage";
import styles from "./profile.module.css";

export default function ProfilePage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="sm" display="flex" className={styles.content}>
        <ClientProfilePage />
      </Container>
    </Flex>
  );
}
