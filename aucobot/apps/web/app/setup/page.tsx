import { ClientSetupPage } from "./_components/ClientSetupPage/ClientSetupPage";
import styles from "./setup.module.css";
import { Flex } from "@/components/layout";
import { isOssRuntime } from "@/lib/runtime/runtime-mode";

export default function SetupPage() {
  const oss = isOssRuntime();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      fullWidth
      className={styles.page}
    >
      <Flex align="stretch" className={styles.content}>
        <ClientSetupPage oss={oss} />
      </Flex>
    </Flex>
  );
}
