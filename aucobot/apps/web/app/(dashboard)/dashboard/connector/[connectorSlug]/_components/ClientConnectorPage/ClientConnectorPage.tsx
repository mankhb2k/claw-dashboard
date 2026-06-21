"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./ClientConnectorPage.module.css";
import { findServiceBySlug } from "../../../connect-display";
import {
  MOCK_PERMISSION_GROUPS,
  type PermissionGroupData,
} from "../../../projectConnectData";
import { ActiveConnection } from "../ActiveConnection/ActiveConnection";
import { NoConnection } from "../NoConnection/NoConnection";
import { BackButton } from "@/components/dashboard";
import { Container, Flex } from "@/components/layout";
import { Typography, Spinner } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { useProjectStore } from "@/stores/project.store";

import type { ConnectorDefinition, ProjectConnector } from "@/schemas/project.schema";

export type PermissionMode = "allow" | "ask" | "block";

interface Props {
  projectId: string;
  connectorSlug: string;
}

export function ClientConnectorPage({ projectId, connectorSlug }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));

  const [definitions, setDefinitions] = useState<ConnectorDefinition[]>([]);
  const [connectors, setConnectors] = useState<ProjectConnector[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupMode, setGroupMode] = useState<Record<string, PermissionMode>>({
    read: "allow",
    write: "ask",
  });
  const [toolMode, setToolMode] = useState<Record<string, PermissionMode>>({});
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({
    read: true,
    write: true,
  });
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setIsLoading(Boolean(projectId));
    setError(null);
  }

  const service = useMemo(
    () => findServiceBySlug(connectorSlug, definitions),
    [connectorSlug, definitions],
  );

  const reload = useCallback(async () => {
    if (!projectId) return;
    const [defs, rows] = await Promise.all([
      projectApi.listConnectorDefinitions(),
      projectApi.listConnectors(projectId),
    ]);
    setDefinitions(defs);
    setConnectors(rows);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      await Promise.resolve();
      try {
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : t("connect.detail.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [projectId, reload, t]);

  useEffect(() => {
    if (searchParams.get("connected") !== "1" || !projectId) return;
    void (async () => {
      await Promise.resolve();
      await reload();
    })();
  }, [searchParams, projectId, reload]);

  const activeConnector = useMemo(
    () =>
      connectors.find(
        (c) =>
          c.connectorSlug === connectorSlug &&
          c.connectionStatus === "connected" &&
          c.enabled,
      ),
    [connectors, connectorSlug],
  );

  const handleConnect = async () => {
    if (!projectId || !service) return;
    setIsConnecting(true);
    try {
      const { url } = await projectApi.startConnectorOAuth(projectId, service.slug);
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : t("connect.detail.connectionFailed"));
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!projectId || !activeConnector) return;
    try {
      await projectApi.deleteConnector(projectId, activeConnector.id);
      router.push("/dashboard/connector");
    } catch (err) {
      alert(err instanceof Error ? err.message : t("connect.detail.disconnectFailed"));
    }
  };

  const applyModeForGroup = (groupId: string, mode: PermissionMode) => {
    setGroupMode((prev) => ({ ...prev, [groupId]: mode }));
    const group = MOCK_PERMISSION_GROUPS.find((g: PermissionGroupData) => g.id === groupId);
    if (group) {
      const newToolModes = { ...toolMode };
      group.tools.forEach((tool: string) => {
        delete newToolModes[tool];
      });
      setToolMode(newToolModes);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Container size="md">
          <Flex center fullHeight direction="column" gap={4} p={8}>
            <Spinner size="lg" />
            <Typography color="muted">{t("connect.page.loading")}</Typography>
          </Flex>
        </Container>
      </div>
    );
  }

  if (error || !project || !service) {
    return (
      <div className={styles.page}>
        <Container size="md">
          <Flex center fullHeight direction="column" gap={24} py={80}>
            <Flex direction="column" center gap={8}>
              <Typography variant="h2" weight="bold" className={styles.error}>
                {error ? t("connect.detail.errorTitle") : t("connect.detail.notFoundTitle")}
              </Typography>
              <Typography color="muted" className={styles.errorText}>
                {!project
                  ? t("connect.detail.notFoundProject")
                  : t("connect.detail.notFoundConnector")}
              </Typography>
            </Flex>
            <BackButton href="/dashboard/connector">
              {t("connect.detail.backToConnections")}
            </BackButton>
          </Flex>
        </Container>
      </div>
    );
  }

  if (!activeConnector) {
    return (
      <NoConnection
        service={service}
        isConnecting={isConnecting}
        onConnect={handleConnect}
      />
    );
  }

  return (
    <ActiveConnection
      service={service}
      groupMode={groupMode}
      toolMode={toolMode}
      groupExpanded={groupExpanded}
      onGroupModeChange={applyModeForGroup}
      onToolModeChange={(tool, mode) => setToolMode((prev) => ({ ...prev, [tool]: mode }))}
      onToggleGroup={(groupId) =>
        setGroupExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
      }
      onDisconnect={handleDisconnect}
    />
  );
}
