"use client";

import { useCallback, useEffect, useState } from "react";
import { Typography, toast } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { PROVIDER_TEST_TIMEOUT_MS } from "@/lib/provider-test";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectEnvMaskedRow } from "@/schemas/project.schema";
import { CardApiKey } from "./CardApiKey/CardApiKey";
import { ModalAddConnection } from "./ModalAddConnection/ModalAddConnection";
import { NoApiKey } from "./NoApiKey/NoApiKey";

export type ProviderConnection = {
  id: string;
  name: string;
  masked: string;
  enabled: boolean;
  pending?: boolean;
  lastError?: string | null;
};

interface ClientPageProps {
  providerId: string;
  providerData: { name: string; envKey?: string; defaultModel?: string };
}

function maskApiKeyPreview(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}

function rowToConnection(row: ProjectEnvMaskedRow): ProviderConnection {
  return {
    id: row.providerId ?? row.key,
    name: row.label ?? row.key,
    masked: row.masked,
    enabled: row.enabled ?? false,
    pending: false,
    lastError: row.lastError,
  };
}

function showError(title: string, description?: string) {
  toast.error(title, description);
}

export function ClientPage({ providerId, providerData }: ClientPageProps) {
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [editingConn, setEditingConn] = useState<{ name: string; key: string } | null>(
    null,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [testingConnId, setTestingConnId] = useState<string | null>(null);

  const openAddModal = () => {
    setFormMode("add");
    setEditingConnId(null);
    setEditingConn(null);
    setShowForm(true);
  };

  const openEditModal = (conn: ProviderConnection) => {
    setFormMode("edit");
    setEditingConnId(conn.id);
    setEditingConn({ name: conn.name, key: "" });
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingConnId(null);
    setEditingConn(null);
  };

  const loadConnections = useCallback(async () => {
    if (!projectId) {
      setConnections([]);
      setIsLoaded(true);
      return;
    }
    try {
      const rows = await projectApi.listProviderKeys(projectId);
      const row = rows.find((r) => r.providerId === providerId);
      setConnections(row ? [rowToConnection(row)] : []);
    } catch (err) {
      setConnections([]);
      showError(
        "Không tải API key",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setIsLoaded(true);
    }
  }, [projectId, providerId]);

  useEffect(() => {
    setIsLoaded(false);
    void loadConnections();
  }, [loadConnections]);

  const handleSaveAdd = async (data: { keyName: string; apiKey: string }) => {
    if (!projectId) return;

    const tempId = crypto.randomUUID();
    const label = data.keyName.trim() || providerData.name;
    const optimistic: ProviderConnection = {
      id: tempId,
      name: label,
      masked: maskApiKeyPreview(data.apiKey),
      enabled: false,
      pending: true,
    };

    setConnections((prev) => [...prev, optimistic]);
    closeModal();

    try {
      const result = await projectApi.saveProviderKey(projectId, providerId, {
        apiKey: data.apiKey,
        label,
        defaultModel: providerData.defaultModel,
      });

      if (!result.ok) {
        setConnections((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...c, enabled: false, pending: false } : c,
          ),
        );
        showError(
          "Test kết nối thất bại",
          result.error ?? `Key không hoạt động (timeout ${PROVIDER_TEST_TIMEOUT_MS / 1000}s)`,
        );
        return;
      }

      toast.success("Đã lưu và kết nối API key");
      await loadConnections();
    } catch (err) {
      setConnections((prev) => prev.filter((c) => c.id !== tempId));
      showError(
        "Lưu API key thất bại",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const handleSaveEdit = async (data: { keyName: string; apiKey: string }) => {
    if (!projectId || !editingConnId) return;

    const label = data.keyName.trim() || providerData.name;
    setConnections((prev) =>
      prev.map((c) =>
        c.id === editingConnId
          ? {
              ...c,
              name: label,
              masked: maskApiKeyPreview(data.apiKey),
              enabled: false,
              pending: true,
            }
          : c,
      ),
    );
    closeModal();

    try {
      const result = await projectApi.saveProviderKey(projectId, providerId, {
        apiKey: data.apiKey,
        label,
        defaultModel: providerData.defaultModel,
      });

      if (!result.ok) {
        setConnections((prev) =>
          prev.map((c) =>
            c.id === editingConnId ? { ...c, enabled: false, pending: false } : c,
          ),
        );
        showError("Test kết nối thất bại", result.error);
        return;
      }

      toast.success("Đã cập nhật API key");
      await loadConnections();
    } catch (err) {
      showError(
        "Cập nhật API key thất bại",
        err instanceof Error ? err.message : undefined,
      );
      await loadConnections();
    }
  };

  const handleSave = (data: { keyName: string; apiKey: string }) => {
    if (formMode === "add") {
      void handleSaveAdd(data);
    } else {
      void handleSaveEdit(data);
    }
  };

  const handleToggleEnabled = async (connId: string, nextEnabled: boolean) => {
    if (!projectId) return;
    const conn = connections.find((c) => c.id === connId);
    if (!conn || conn.pending) return;

    setTestingConnId(connId);
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, enabled: nextEnabled } : c)),
    );

    try {
      const result = await projectApi.setProviderEnabled(
        projectId,
        providerId,
        nextEnabled,
      );
      if (!result.ok && nextEnabled) {
        setConnections((prev) =>
          prev.map((c) => (c.id === connId ? { ...c, enabled: false } : c)),
        );
        showError("Không bật kết nối", result.error);
      } else if (nextEnabled) {
        toast.success("Đã bật kết nối");
        await loadConnections();
      } else {
        await loadConnections();
      }
    } catch (err) {
      setConnections((prev) =>
        prev.map((c) => (c.id === connId ? { ...c, enabled: !nextEnabled } : c)),
      );
      showError(
        "Không đổi trạng thái kết nối",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTestingConnId(null);
    }
  };

  const handleDelete = async (connId: string) => {
    if (!projectId || !providerData.envKey) return;
    setTestingConnId(connId);
    try {
      await projectApi.deleteEnvKey(projectId, providerData.envKey);
      setConnections((prev) => prev.filter((c) => c.id !== connId));
      toast.success("Đã xóa API key");
    } catch (err) {
      showError(
        "Xóa API key thất bại",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTestingConnId(null);
    }
  };

  const hasKey = connections.length > 0;

  return (
    <>
      {!isLoaded || !hasKey ? (
        <NoApiKey isLoading={!isLoaded} onAdd={openAddModal} />
      ) : (
        <>
          <Typography variant="h3" weight="bold" style={{ marginBottom: "0.25rem" }}>
            API Key
          </Typography>
          <CardApiKey
            connections={connections.map((c) => ({
              id: c.id,
              name: c.name,
              key: c.masked,
              disabled: !c.enabled,
              pending: c.pending,
            }))}
            isLoaded={isLoaded}
            testingConnId={testingConnId}
            onEdit={(conn) => {
              const full = connections.find((c) => c.id === conn.id);
              if (full) openEditModal(full);
            }}
            onDelete={(id) => void handleDelete(id)}
            onToggleDisabled={(id) => {
              const conn = connections.find((c) => c.id === id);
              if (!conn || testingConnId) return;
              void handleToggleEnabled(id, !conn.enabled);
            }}
          />
        </>
      )}

      <ModalAddConnection
        isOpen={showForm}
        onClose={closeModal}
        provider={providerData}
        mode={formMode}
        editingConn={editingConn}
        onSubmit={handleSave}
      />
    </>
  );
}
