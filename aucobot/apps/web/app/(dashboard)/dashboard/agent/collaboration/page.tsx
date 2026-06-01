import React from "react";
import { Flex, Container } from "@/components/layout";
import { AgentPageShell } from "../_components/AgentPageShell/AgentPageShell";
import ClientCollaborationPage from "../_components/ClientCollaborationPage/ClientCollaborationPage";
import styles from "../agent.module.css";

export default function AgentCollaborationPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <AgentPageShell>
          <ClientCollaborationPage />
        </AgentPageShell>
      </Container>
    </Flex>
  );
}
