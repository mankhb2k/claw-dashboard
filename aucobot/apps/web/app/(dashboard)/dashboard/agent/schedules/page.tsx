import React from "react";
import { Flex, Container } from "@/components/layout";
import ClientProjectSchedulesPage from "../_components/ClientProjectSchedulesPage/ClientProjectSchedulesPage";
import styles from "../agent.module.css";

export default function AgentSchedulesPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="lg" display="flex" className={styles.content}>
        <ClientProjectSchedulesPage />
      </Container>
    </Flex>
  );
}
