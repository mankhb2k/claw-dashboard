import React from "react";
import { Flex, Container } from "@/components/layout";
import { ClientCreateAgentPage } from "./_components/ClientCreateAgentPage";
import styles from "../[agentId]/agentId.module.css";

export default function CreateAgentPage() {
  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="full" display="flex" className={styles.content}>
        <ClientCreateAgentPage />
      </Container>
    </Flex>
  );
}
