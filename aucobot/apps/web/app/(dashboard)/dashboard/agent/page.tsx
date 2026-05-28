import React from "react";
import { Flex, Container } from "@/components/layout";
import { TitleHeader } from "@/components/dashboard";
import ClientAgentPage from "./_components/ClientAgentPage/ClientAgentPage";
import styles from "./agent.module.css";

export default function AgentPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <TitleHeader
          title="Agent Team"
          description="Manage and design intelligent AI agents for your projects."
          showBorder
        />
        <ClientAgentPage />
      </Container>
    </Flex>
  );
}
