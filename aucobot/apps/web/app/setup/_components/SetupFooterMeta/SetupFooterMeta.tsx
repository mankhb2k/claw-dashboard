import { Flex } from "@/components/layout";
import { Typography } from "@/components/ui";

interface SetupFooterMetaProps {
  oss: boolean;
}

export function SetupFooterMeta({ oss }: SetupFooterMetaProps) {
  return (
    <Flex direction="column" align="center" style={{ marginTop: "var(--space-4)" }}>
      <Typography variant="xs" color="muted">
        {oss ? (
          <>
            Uses one shared gateway (
            <code>docker compose -f deploy/docker-compose.gateway.dev.yml</code>). Per-project spawn
            is not used.
          </>
        ) : (
          <>
            Project is created once. Stopped container → <strong>start</strong>. Missing container
            → <strong>respawn</strong>.
          </>
        )}
      </Typography>
    </Flex>
  );
}
