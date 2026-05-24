import { Suspense } from "react";
import { getCurrentProjectId } from "@/lib/current-project";
import ClientConnectPage from "./_components/ClientConnectPage/ClientConnectPage";
import { Container, Flex } from "@/components/layout";
import { TitleHeader } from "@/components/dashboard";
import { Spinner } from "@/components/ui";
import styles from "./connect.module.css";

export default async function ProjectConnectPage() {
  const projectId = await getCurrentProjectId();

  return (
    <Flex direction="column" align="stretch" className={styles.page}>
      <Container size="md" display="flex" className={styles.content}>
        <TitleHeader
          title="Trung tâm kết nối"
          description="Kết nối dự án của bạn với các dịch vụ bên ngoài."
          showBorder
        />
        <Suspense
          fallback={
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
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
