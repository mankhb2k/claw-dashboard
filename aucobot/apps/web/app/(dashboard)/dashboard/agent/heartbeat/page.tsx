import React from "react";
import { Flex, Container } from "@/components/layout";
import ClientProjectHeartbeatPage from "../_components/ClientProjectHeartbeatPage/ClientProjectHeartbeatPage";
import styles from "../agent.module.css";

export default function AgentHeartbeatPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <ClientProjectHeartbeatPage />
      </Container>
    </Flex>
  );
}
