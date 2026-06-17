import { Suspense } from "react";
import { getCurrentProjectId } from "@/lib/current-project";
import { ClientConnectPage } from "./_components/ClientConnectPage/ClientConnectPage";
import { Container, Flex } from "@/components/layout";
import { Spinner } from "@/components/ui";
import styles from "./connect.module.css";

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
