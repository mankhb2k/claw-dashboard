import React from "react";
import { Flex, Container } from "@/components/layout";
import { AgentPageShell } from "../_components/AgentPageShell/AgentPageShell";
import ClientProjectHeartbeatPage from "../_components/ClientProjectHeartbeatPage/ClientProjectHeartbeatPage";
import styles from "../agent.module.css";

export default function AgentHeartbeatPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <AgentPageShell>
          <ClientProjectHeartbeatPage />
        </AgentPageShell>
      </Container>
    </Flex>
  );
}
