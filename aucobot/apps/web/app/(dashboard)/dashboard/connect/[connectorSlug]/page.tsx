import { Suspense } from "react";
import { getCurrentProjectId } from "@/lib/current-project";
import { ClientConnectorPage } from "./_components/ClientConnectorPage/ClientConnectorPage";
import { Spinner } from "@/components/ui";

interface PageProps {
  params: Promise<{
    connectorSlug: string;
  }>;
}

export default async function ProjectConnectorDetailPage({ params }: PageProps) {
  const { connectorSlug } = await params;
  const projectId = await getCurrentProjectId();

  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
          <Spinner size="md" />
        </div>
      }
    >
      <ClientConnectorPage projectId={projectId} connectorSlug={connectorSlug} />
    </Suspense>
  );
}
