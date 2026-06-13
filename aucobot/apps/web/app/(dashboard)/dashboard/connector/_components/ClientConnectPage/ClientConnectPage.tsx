"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectStore } from "@/stores/project.store";
import { projectApi } from "@/lib/api/project";
import type { ProjectConnector } from "@/schemas/project.schema";
import { Button } from "@/components/ui/Button/Button";
import styles from "./ClientConnectPage.module.css";
import { Typography } from "@/components/ui/Typography/Typography";
import { Flex } from "@/components/layout";
import { toServiceConnectData } from "../../connect-display";
import type { ServiceConnectData } from "../../projectConnectData";
import { CardConnection } from "../CardConnection/CardConnection";
import { ModalConnectorBrowser } from "../ModalConnectorBrowser/ModalConnectorBrowser";
import { ModalCustomConnector } from "../ModalCustomConnector/ModalCustomConnector";
import { Spinner } from "@/components/ui/Spinner/Spinner";

interface ClientConnectPageProps {
  projectId: string;
}

export default function ClientConnectPage({ projectId }: ClientConnectPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("oauth_error");
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  const [fetched, setFetched] = useState(false);
  const [connectors, setConnectors] = useState<ProjectConnector[]>([]);
  const [catalog, setCatalog] = useState<ServiceConnectData[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appStoreOpen, setAppStoreOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const loadConnectData = useCallback(async () => {
    if (!projectId) return;
    setLoadError(null);
    const [defs, rows] = await Promise.all([
      projectApi.listConnectorDefinitions(),
      projectApi.listConnectors(projectId),
    ]);
    setCatalog(defs.map(toServiceConnectData));
    setConnectors(rows);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setFetched(false);
    void fetchProjects()
      .then(() => loadConnectData())
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Failed to load data"),
      )
      .finally(() => setFetched(true));
  }, [projectId, fetchProjects, loadConnectData]);

  const connectedSlugs = useMemo(
    () =>
      new Set(
        connectors
          .filter((c) => c.connectionStatus === "connected" && c.enabled)
          .map((c) => c.connectorSlug),
      ),
    [connectors],
  );

  const visibleServices = useMemo(
    () => catalog.filter((svc) => connectedSlugs.has(svc.slug)),
    [catalog, connectedSlugs],
  );

  const handleConnect = (serviceId: string) => {
    const svc = catalog.find((s) => s.id === serviceId);
    if (!svc) return;
    setAppStoreOpen(false);
    router.push(`/dashboard/connector/${svc.slug}`);
  };

  const handleDisconnect = async (slug: string) => {
    const row = connectors.find((c) => c.connectorSlug === slug);
    if (!row || !projectId) return;
    try {
      await projectApi.deleteConnector(projectId, row.id);
      await loadConnectData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  if (!projectId || (fetched && !project)) {
    return <p className={styles.error}>Project not found.</p>;
  }

  if (!project && !fetched) {
    return (
      <Flex direction="column" align="center" justify="center" gap={3} className={styles.loadingContainer}>
        <Spinner size="md" />
        <Typography variant="p" color="muted">Loading...</Typography>
      </Flex>
    );
  }

  if (loadError) {
    return <p className={styles.error}>{loadError}</p>;
  }

  return (
    <>
      {oauthError ? (
        <p className={styles.error} role="alert">
          OAuth failed: {oauthError}
        </p>
      ) : null}
      <div className={styles.toolbar}>
        <Button variant="primary" onClick={() => setAppStoreOpen(true)}>
          Add connection
        </Button>
        <Button variant="primary" onClick={() => setCustomModalOpen(true)}>
          Add custom connection
        </Button>
      </div>

      <Flex direction="column" gap={2}>
        {!fetched ? (
          <Flex justify="center" align="center" className={styles.centeredPanel}>
            <Spinner size="md" />
          </Flex>
        ) : visibleServices.length > 0 ? (
          visibleServices.map((svc) => (
            <CardConnection
              key={svc.slug}
              service={svc}
              onViewDetails={() => router.push(`/dashboard/connector/${svc.slug}`)}
              onDisconnect={() => void handleDisconnect(svc.slug)}
              onRemove={() => void handleDisconnect(svc.slug)}
            />
          ))
        ) : (
          <Flex justify="center" align="center" className={styles.centeredPanel}>
            <Typography variant="small" color="muted">
              No services connected yet.
            </Typography>
          </Flex>
        )}
      </Flex>

      {appStoreOpen && (
        <ModalConnectorBrowser
          services={catalog}
          connections={Object.fromEntries([...connectedSlugs].map((slug) => [slug, true]))}
          onClose={() => setAppStoreOpen(false)}
          onConnect={handleConnect}
          onOpenDetails={(service) => router.push(`/dashboard/connector/${service.slug}`)}
        />
      )}
      {customModalOpen && <ModalCustomConnector onClose={() => setCustomModalOpen(false)} />}
    </>
  );
}
