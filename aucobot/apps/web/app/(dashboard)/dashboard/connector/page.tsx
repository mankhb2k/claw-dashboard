import { Suspense } from "react";

import { ClientConnectPage } from "./_components/ClientConnectPage/ClientConnectPage";
import styles from "./connect.module.css";
import { Container, Flex } from "@/components/layout";
import { Spinner } from "@/components/ui";
import { getCurrentProjectId } from "@/lib/current-project";

export default async function ProjectConnectPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <Suspense
          fallback={
            <div className={styles.suspenseFallback}>
              <Spinner size="md" />
            </div>
          }
        >
          <ClientConnectPage projectId={projectId} />
        </Suspense>
      </Container>
    </Flex>
  );
}
