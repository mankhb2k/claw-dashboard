"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Info } from "lucide-react";
import { Button, Card, Typography, toast } from "@/components/ui";
import { Box, Flex } from "@/components/layout";
import { BackButton } from "@/components/dashboard";
import { projectApi } from "@/lib/api/project";
import { PROVIDER_TEST_TIMEOUT_MS } from "@/utils/ai-model/provider-test";
import { useProjectStore } from "@/stores/project.store";
import type { ProjectEnvMaskedRow } from "@/schemas/project.schema";
import { GEMINI_DEFAULT_OPENCLAW_MODEL } from "@/utils/ai-model/gemini-models";
import { OPENAI_DEFAULT_OPENCLAW_MODEL } from "@/utils/ai-model/openai-models";
import {
  getCatalogSource,
  APIKEY_PROVIDERS,
  type ModelDef,
} from "../../../providersData";
import { CardApiKey } from "../CardApiKey/CardApiKey";
import { CardChip } from "../CardChip/CardChip";
import { ModalAddConnection } from "../ModalAddConnection/ModalAddConnection";
import { NoApiKey } from "../NoApiKey/NoApiKey";
import { ProviderHeader } from "../ProviderHeader/ProviderHeader";
import styles from "./ClientProviderIdPage.module.css";

const TIER_ORDER = ["stable", "preview", "deprecated"] as const;
const TIER_TITLE: Record<(typeof TIER_ORDER)[number], string> = {
  stable: "Stable — production use",
  preview: "Preview — may change / deprecate",
  deprecated: "Deprecated — migrate when possible",
};

type ProviderConnection = {
  id: string;
  name: string;
  masked: string;
  enabled: boolean;
  pending?: boolean;
  lastError?: string | null;
};

interface ClientProviderIdPageProps {
  providerId: string;
}

function groupModelsByTier(models: ModelDef[]) {
  const groups = new Map<string, ModelDef[]>();
  for (const tier of TIER_ORDER) {
    const list = models.filter((m) => (m.tier ?? "stable") === tier);
    if (list.length) groups.set(tier, list);
  }
  const other = models.filter(
    (m) =>
      m.tier && !TIER_ORDER.includes(m.tier as (typeof TIER_ORDER)[number]),
  );
  if (other.length) groups.set("other", other);
  return groups;
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

function resolveDefaultModel(
  providerId: string,
  providerData: NonNullable<(typeof APIKEY_PROVIDERS)[number]>,
) {
  if (providerId === "gemini") return GEMINI_DEFAULT_OPENCLAW_MODEL;
  if (providerId === "openai") return OPENAI_DEFAULT_OPENCLAW_MODEL;
  return (
    providerData.models?.find((m) => m.recommended)?.openclawId ??
    providerData.models?.[0]?.openclawId
  );
}

export function ClientProviderIdPage({
  providerId,
}: ClientProviderIdPageProps) {
  const providerData = APIKEY_PROVIDERS.find((p) => p.id === providerId);
  const defaultModel = providerData
    ? resolveDefaultModel(providerId, providerData)
    : undefined;

  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [editingConn, setEditingConn] = useState<{
    name: string;
    key: string;
  } | null>(null);
  const [editKeyLoading, setEditKeyLoading] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
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
    setEditingConn({ name: conn.name, key: revealedKeys[conn.id] ?? "" });
    setEditKeyLoading(!revealedKeys[conn.id]);
    setShowForm(true);

    if (revealedKeys[conn.id] || !projectId) {
      setEditKeyLoading(false);
      return;
    }

    void projectApi
      .revealProviderKey(projectId, providerId)
      .then(({ apiKey }) => {
        setRevealedKeys((prev) => ({ ...prev, [conn.id]: apiKey }));
        setEditingConn({ name: conn.name, key: apiKey });
      })
      .catch((err) => {
        closeModal();
        showError(
          "Không tải được API key",
          err instanceof Error ? err.message : undefined,
        );
      })
      .finally(() => {
        setEditKeyLoading(false);
      });
  };

  const revealProviderApiKey = useCallback(
    async (connId: string): Promise<string> => {
      if (revealedKeys[connId]) {
        return revealedKeys[connId];
      }
      if (!projectId) {
        throw new Error("Missing project");
      }
      try {
        const { apiKey } = await projectApi.revealProviderKey(
          projectId,
          providerId,
        );
        setRevealedKeys((prev) => ({ ...prev, [connId]: apiKey }));
        return apiKey;
      } catch (err) {
        showError(
          "Không tải được API key",
          err instanceof Error ? err.message : undefined,
        );
        throw err;
      }
    },
    [projectId, providerId, revealedKeys],
  );

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
      setRevealedKeys({});
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
    if (!projectId || !providerData) return;

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
        defaultModel,
      });

      if (!result.ok) {
        setConnections((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...c, enabled: false, pending: false } : c,
          ),
        );
        showError(
          "Connection api key failed",
          result.error ??
            `Api key is not working (timeout ${PROVIDER_TEST_TIMEOUT_MS / 1000}s)`,
        );
        return;
      }

      toast.success("Saved and connected API key");
      await loadConnections();
    } catch (err) {
      setConnections((prev) => prev.filter((c) => c.id !== tempId));
      showError(
        "Save API key failed",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const handleSaveEdit = async (data: { keyName: string; apiKey: string }) => {
    if (!projectId || !editingConnId || !providerData) return;

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
        defaultModel,
      });

      if (!result.ok) {
        setConnections((prev) =>
          prev.map((c) =>
            c.id === editingConnId
              ? { ...c, enabled: false, pending: false }
              : c,
          ),
        );
        showError("Connection api key failed", result.error);
        return;
      }

      toast.success("Updated API key successfully");
      await loadConnections();
    } catch (err) {
      showError(
        "Update API key failed",
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
        showError("Enable connection failed", result.error);
      } else if (nextEnabled) {
        toast.success("Connected API key successfully");
        await loadConnections();
      } else {
        await loadConnections();
      }
    } catch (err) {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connId ? { ...c, enabled: !nextEnabled } : c,
        ),
      );
      showError(
        "Change connection status failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTestingConnId(null);
    }
  };

  const handleDelete = async (connId: string) => {
    if (!projectId) return;
    setTestingConnId(connId);
    try {
      await projectApi.deleteProviderKey(projectId, providerId);
      setConnections((prev) => prev.filter((c) => c.id !== connId));
      toast.success("Deleted API key successfully");
    } catch (err) {
      showError(
        "Delete API key failed",
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTestingConnId(null);
    }
  };

  if (!providerData) {
    return (
      <Flex direction="column" gap={24} className={styles.shell}>
        <Flex
          direction="column"
          center
          gap={12}
          py={40}
          className={styles.state}
        >
          <CircleAlert size={40} className={styles.errorIcon} />
          <Typography color="muted">Provider not found</Typography>
          <BackButton href="/dashboard/ai-model">Back to Providers</BackButton>
        </Flex>
      </Flex>
    );
  }

  const models: ModelDef[] = providerData.models ?? [];
  const openclawProviderId = providerData.openclawProviderId ?? providerData.id;
  const catalogSource = getCatalogSource(providerId);
  const modelGroups = groupModelsByTier(models);
  const hasKey = connections.length > 0;

  return (
    <Flex direction="column" gap={24} className={styles.shell}>
      <BackButton href="/dashboard/ai-model">Back to Providers</BackButton>
      <ProviderHeader
        name={providerData.name}
        iconSrc={providerData.iconSrc}
        color={providerData.color}
        apiKeyUrl={providerData.apiKeyUrl}
        apiKeyLabel={providerData.apiKeyLabel}
      />

      {!isLoaded || !hasKey ? (
        <NoApiKey isLoading={!isLoaded} onAdd={openAddModal} />
      ) : (
        <Flex direction="column" gap={4}>
          <Typography variant="h3" weight="bold">
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
            onRevealKey={revealProviderApiKey}
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
        </Flex>
      )}

      <ModalAddConnection
        isOpen={showForm}
        onClose={closeModal}
        provider={{ name: providerData.name }}
        mode={formMode}
        editingConn={editingConn}
        editKeyLoading={editKeyLoading}
        onSubmit={handleSave}
      />

      <Flex direction="column" gap={16} className={styles.modelsSection}>
        <Typography variant="h3" weight="bold">
          Available models
        </Typography>
        <Typography variant="small" color="muted">
          {catalogSource ? (
            <>
              Reference list from{" "}
              <a
                href={catalogSource.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {catalogSource.label}
              </a>
              . {catalogSource.note}
            </>
          ) : (
            <>Model catalog reference for this provider.</>
          )}
        </Typography>

        <Card disableHover className={styles.modelsWrapper}>
          {Array.from(modelGroups.entries()).map(([tier, tierModels]) => (
            <Flex
              as="section"
              key={tier}
              direction="column"
              gap={12}
              className={styles.modelTierSection}
            >
              <Typography
                variant="small"
                weight="bold"
                className={styles.modelTierTitle}
              >
                {TIER_TITLE[tier as keyof typeof TIER_TITLE] ?? tier}
              </Typography>
              <Flex wrap="wrap" gap={10}>
                {tierModels.map((model) => (
                  <CardChip
                    key={model.openclawId ?? model.id}
                    model={model}
                    openclawProviderId={openclawProviderId}
                  />
                ))}
              </Flex>
            </Flex>
          ))}
        </Card>
      </Flex>

      <Box radius="md" className={styles.noteBox}>
        <Flex align="start" gap={6}>
          <Info size={16} className={styles.noteIcon} />
          <Typography variant="small" color="muted">
            <strong>Model catalog</strong> lives on the frontend/API (static
            metadata). <strong>API keys</strong> are stored in the DB and synced
            to <code>openclaw.json</code>. When setting a project default model,
            save <code>defaultModel</code> (e.g.{" "}
            <code>google/gemini-2.5-flash</code>) — no separate table per
            catalog model is required.
          </Typography>
        </Flex>
      </Box>
    </Flex>
  );
}
