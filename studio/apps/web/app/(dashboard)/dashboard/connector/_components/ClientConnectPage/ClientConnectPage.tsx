"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";

import styles from "./ClientConnectPage.module.css";
import { toServiceConnectData } from "../../connect-display";
import { CardConnection } from "../CardConnection/CardConnection";
import { ModalConnectorBrowser } from "../ModalConnectorBrowser/ModalConnectorBrowser";
import { ModalCustomConnector } from "../ModalCustomConnector/ModalCustomConnector";
import { TitleHeader } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import { Button } from "@/components/ui/Button/Button";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { Typography } from "@/components/ui/Typography/Typography";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";

import type { ServiceConnectData } from "../../projectConnectData";
import type { ProjectConnector } from "@/schemas/project.schema";

interface ClientConnectPageProps {
  projectId: string;
}

export function ClientConnectPage({ projectId }: ClientConnectPageProps) {
  const { t } = useI18n();
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
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setFetched(false);
  }

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
    void fetchProjects()
      .then(() => loadConnectData())
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : t("connect.page.failedToLoad")),
      )
      .finally(() => setFetched(true));
  }, [projectId, fetchProjects, loadConnectData, t]);

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
      alert(err instanceof Error ? err.message : t("connect.page.failedToDisconnect"));
    }
  };

  const pageHeader = (
    <TitleHeader
      titleKey="connect.page.title"
      descriptionKey="connect.page.description"
      showBorder
    />
  );

  if (!projectId || (fetched && !project)) {
    return (
      <>
        {pageHeader}
        <p className={styles.error}>{t("connect.page.projectNotFound")}</p>
      </>
    );
  }

  if (!project && !fetched) {
    return (
      <>
        {pageHeader}
        <Flex direction="column" align="center" justify="center" gap={3} className={styles.loadingContainer}>
          <Spinner size="md" />
          <Typography variant="p" color="muted">{t("connect.page.loading")}</Typography>
        </Flex>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        {pageHeader}
        <p className={styles.error}>{loadError}</p>
      </>
    );
  }

  return (
    <>
      {pageHeader}
      {oauthError ? (
        <p className={styles.error} role="alert">
          {t("connect.page.oauthFailed", { error: oauthError })}
        </p>
      ) : null}
      <div className={styles.toolbar}>
        <Button variant="primary" onClick={() => setAppStoreOpen(true)}>
          {t("connect.page.addConnection")}
        </Button>
        <Button variant="primary" onClick={() => setCustomModalOpen(true)}>
          {t("connect.page.addCustomConnection")}
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
              {t("connect.page.emptyConnected")}
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
