import { ClientSetupPage } from "./_components/ClientSetupPage/ClientSetupPage";
import styles from "./setup.module.css";
import { Flex } from "@/components/layout";

export default function SetupPage() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      fullWidth
      className={styles.page}
    >
      <Flex align="stretch" className={styles.content}>
        <ClientSetupPage />
      </Flex>
    </Flex>
  );
}
