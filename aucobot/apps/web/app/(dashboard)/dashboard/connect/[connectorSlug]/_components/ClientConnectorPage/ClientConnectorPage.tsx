"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useProjectStore } from "@/stores/project.store";
import { projectApi } from "@/lib/api/project";
import type { ConnectorDefinition, ProjectConnector } from "@/schemas/project.schema";
import {
  MOCK_PERMISSION_GROUPS,
  type PermissionGroupData,
} from "../../../projectConnectData";
import { findServiceBySlug } from "../../../connect-display";
import { Button, Typography, Spinner } from "@/components/ui";
import { Container, Flex } from "@/components/layout";
import { NoConnection } from "../NoConnection/NoConnection";
import { ActiveConnection } from "../ActiveConnection/ActiveConnection";
import styles from "./client-connector.module.css";

export type PermissionMode = "allow" | "ask" | "block";

interface Props {
  projectId: string;
  connectorSlug: string;
}

export function ClientConnectorPage({ projectId, connectorSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));

  const [definitions, setDefinitions] = useState<ConnectorDefinition[]>([]);
  const [connectors, setConnectors] = useState<ProjectConnector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const service = useMemo(
    () => findServiceBySlug(connectorSlug, definitions),
    [connectorSlug, definitions],
  );

  const reload = async () => {
    if (!projectId) return;
    const [defs, rows] = await Promise.all([
      projectApi.listConnectorDefinitions(),
      projectApi.listConnectors(projectId),
    ]);
    setDefinitions(defs);
    setConnectors(rows);
  };

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    reload()
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải connectors"))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (searchParams.get("connected") === "1" && projectId) {
      void reload();
    }
  }, [searchParams, projectId]);

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
      alert(err instanceof Error ? err.message : "Kết nối thất bại");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!projectId || !activeConnector) return;
    try {
      await projectApi.deleteConnector(projectId, activeConnector.id);
      router.push("/dashboard/connect");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gỡ kết nối thất bại");
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
            <Typography color="muted">Đang tải dữ liệu...</Typography>
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
                {error ? "Đã có lỗi xảy ra" : "Không tìm thấy dữ liệu"}
              </Typography>
              <Typography color="muted" className={styles.errorText}>
                {!project
                  ? "Dự án bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập."
                  : "Dịch vụ kết nối này không khả dụng hoặc chưa được hỗ trợ trên backend."}
              </Typography>
            </Flex>
            <Button variant="outline" size="lg" onClick={() => router.back()}>
              <ChevronLeft size={18} /> Quay lại danh sách kết nối
            </Button>
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
