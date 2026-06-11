import { Flex } from "@/components/layout";
import { Typography } from "@/components/ui";
import styles from "./SetupFooterMeta.module.css";

interface SetupFooterMetaProps {
  oss: boolean;
}

export function SetupFooterMeta({ oss }: SetupFooterMetaProps) {
  if (oss) return null;

  return (
    <Flex direction="column" align="center" className={styles.root}>
      <Typography variant="xs" color="muted">
        Project is created once. Stopped container → <strong>start</strong>. Missing container →{" "}
        <strong>respawn</strong>.
      </Typography>
    </Flex>
  );
}
