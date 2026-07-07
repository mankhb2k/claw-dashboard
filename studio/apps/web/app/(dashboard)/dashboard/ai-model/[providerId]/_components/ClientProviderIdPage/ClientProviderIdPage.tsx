"use client";

import { CircleAlert, Info, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import styles from "./ClientProviderIdPage.module.css";
import { CardApiKey } from "../CardApiKey/CardApiKey";
import { CardChip } from "../CardChip/CardChip";
import { ModalAddConnection } from "../ModalAddConnection/ModalAddConnection";
import { ModalAddModel } from "../ModalAddModel/ModalAddModel";
import { NoApiKey } from "../NoApiKey/NoApiKey";
import { ProviderHeader } from "../ProviderHeader/ProviderHeader";
import { BackButton } from "@/components/dashboard";
import { Box, Flex } from "@/components/layout";
import { Button, Card, Typography, toast } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import { translate } from "@/lib/i18n/translate";
import { useProjectStore } from "@/stores/project.store";
import { PROVIDER_TEST_TIMEOUT_MS } from "@/utils/ai-model/provider-test";
import {
  getCatalogSource,
  getProviderUiMetadata,
  isPhase1ProviderId,
  type ModelDef,
} from "@/utils/ai-model/providers-data";

import type {
  ProjectEnvMaskedRow,
  ProviderDefinition,
  ProviderModelRow,
  ProviderStarterModel,
} from "@/schemas/project.schema";

const TIER_ORDER = ["stable", "preview", "deprecated"] as const;
const TIER_KEYS: Record<(typeof TIER_ORDER)[number], string> = {
  stable: "aiModel.tiers.stable",
  preview: "aiModel.tiers.preview",
  deprecated: "aiModel.tiers.deprecated",
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

function catalogModelsFromDefinition(
  definition: ProviderDefinition,
): ModelDef[] {
  return (definition.models ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    openclawId: m.openclawId,
    tier: m.tier,
    description: m.description,
    recommended: m.recommended,
    isFree: m.isFree,
  }));
}

export function ClientProviderIdPage({
  providerId,
}: ClientProviderIdPageProps) {
  const { t } = useI18n();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");
  const [definition, setDefinition] = useState<ProviderDefinition | null>(
    null,
  );
  const [definitionLoading, setDefinitionLoading] = useState(true);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [userModels, setUserModels] = useState<ProviderModelRow[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [addModelPreset, setAddModelPreset] = useState("");
  const [addingModel, setAddingModel] = useState(false);
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
  const [modelActionId, setModelActionId] = useState<string | null>(null);

  const uiMeta = getProviderUiMetadata(providerId);
  const isProxy = definition?.category === "proxy";
  const defaultModel = definition?.defaultModel;

  const [trackedProviderId, setTrackedProviderId] = useState(providerId);
  if (providerId !== trackedProviderId) {
    setTrackedProviderId(providerId);
    setDefinitionLoading(true);
  }

  useEffect(() => {
    void projectApi
      .listProviderDefinitions()
      .then((defs) => {
        const match = defs.find((d) => d.id === providerId) ?? null;
        setDefinition(match);
      })
      .catch((err) => {
        setDefinition(null);
        showError(
          translate("aiModel.errors.loadProvider"),
          err instanceof Error ? err.message : undefined,
        );
      })
      .finally(() => setDefinitionLoading(false));
  }, [providerId]);

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
          translate("aiModel.errors.loadApiKey"),
          err instanceof Error ? err.message : undefined,
        );
      })
      .finally(() => {
        setEditKeyLoading(false);
      });
  };

  const revealProviderApiKey = async (connId: string): Promise<string> => {
    if (revealedKeys[connId]) {
      return revealedKeys[connId];
    }
    if (!projectId) {
      throw new Error(translate("aiModel.errors.missingProject"));
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
        translate("aiModel.errors.loadApiKey"),
        err instanceof Error ? err.message : undefined,
      );
      throw err;
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingConnId(null);
    setEditingConn(null);
  };

  const loadConnections = useCallback(async () => {
    await Promise.resolve();
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
        translate("aiModel.errors.loadApiKey"),
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setIsLoaded(true);
    }
  }, [projectId, providerId]);

  const loadUserModels = useCallback(async () => {
    await Promise.resolve();
    if (!projectId || !isProxy) {
      setUserModels([]);
      return;
    }
    setModelsLoading(true);
    try {
      const rows = await projectApi.listProviderModels(projectId, providerId);
      setUserModels(rows);
    } catch (err) {
      setUserModels([]);
      showError(
        translate("aiModel.errors.loadModels"),
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setModelsLoading(false);
    }
  }, [projectId, providerId, isProxy]);

  const connectionsFetchKey = `${projectId}:${providerId}`;
  const [trackedConnectionsFetchKey, setTrackedConnectionsFetchKey] = useState(
    connectionsFetchKey,
  );
  if (connectionsFetchKey !== trackedConnectionsFetchKey) {
    setTrackedConnectionsFetchKey(connectionsFetchKey);
    setIsLoaded(false);
  }

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadConnections();
    })();
  }, [loadConnections]);

  const shouldLoadUserModels = isProxy && connections.length > 0;
  const [trackedShouldLoadUserModels, setTrackedShouldLoadUserModels] = useState(
    shouldLoadUserModels,
  );
  if (shouldLoadUserModels !== trackedShouldLoadUserModels) {
    setTrackedShouldLoadUserModels(shouldLoadUserModels);
    if (!shouldLoadUserModels) {
      setUserModels([]);
    }
  }

  useEffect(() => {
    if (!shouldLoadUserModels) return;
    void (async () => {
      await Promise.resolve();
      await loadUserModels();
    })();
  }, [shouldLoadUserModels, loadUserModels]);

  const handleSaveAdd = async (data: { keyName: string; apiKey: string }) => {
    if (!projectId || !definition) return;

    const tempId = crypto.randomUUID();
    const label = data.keyName.trim() || definition.displayName;
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
          translate("aiModel.errors.connectApiKeyFailed"),
          result.error ??
            `Api key is not working (timeout ${PROVIDER_TEST_TIMEOUT_MS / 1000}s)`,
        );
        return;
      }

      toast.success(t("aiModel.toasts.savedConnected"));
      await loadConnections();
    } catch (err) {
      setConnections((prev) => prev.filter((c) => c.id !== tempId));
      showError(
        translate("aiModel.errors.saveApiKeyFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const handleSaveEdit = async (data: { keyName: string; apiKey: string }) => {
    if (!projectId || !editingConnId || !definition) return;

    const label = data.keyName.trim() || definition.displayName;
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
        showError(t("aiModel.errors.connectApiKeyFailed"), result.error);
        return;
      }

      toast.success(t("aiModel.toasts.updatedApiKey"));
      await loadConnections();
    } catch (err) {
      showError(
        translate("aiModel.errors.updateApiKeyFailed"),
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
        showError(t("aiModel.errors.enableConnectionFailed"), result.error);
      } else if (nextEnabled) {
        toast.success(t("aiModel.toasts.connectedApiKey"));
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
        translate("aiModel.errors.changeConnectionStatusFailed"),
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
      setUserModels([]);
      toast.success(t("aiModel.toasts.deletedApiKey"));
    } catch (err) {
      showError(
        translate("aiModel.errors.deleteApiKeyFailed"),
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setTestingConnId(null);
    }
  };

  const openAddModelModal = (presetOpenclawId = "") => {
    setAddModelPreset(presetOpenclawId);
    setShowAddModel(true);
  };

  const handleAddModel = async (data: {
    openclawId: string;
    displayName?: string;
    setDefault: boolean;
  }) => {
    if (!projectId) return;
    setAddingModel(true);
    try {
      await projectApi.addProviderModel(projectId, providerId, data);
      toast.success(t("aiModel.toasts.modelAdded"));
      setShowAddModel(false);
      await loadUserModels();
    } catch (err) {
      showError(
        translate("aiModel.errors.addModelFailed"),
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setAddingModel(false);
    }
  };

  const handleSetDefaultModel = async (modelId: string) => {
    if (!projectId) return;
    setModelActionId(modelId);
    try {
      await projectApi.updateProviderModel(projectId, providerId, modelId, {
        setDefault: true,
      });
      toast.success(t("aiModel.toasts.defaultModelUpdated"));
      await loadUserModels();
    } catch (err) {
      showError(
        translate("aiModel.errors.updateDefaultModelFailed"),
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setModelActionId(null);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!projectId) return;
    setModelActionId(modelId);
    try {
      await projectApi.deleteProviderModel(projectId, providerId, modelId);
      toast.success(t("aiModel.toasts.modelRemoved"));
      await loadUserModels();
    } catch (err) {
      showError(
        translate("aiModel.errors.deleteModelFailed"),
        err instanceof Error ? err.message : undefined,
      );
    } finally {
      setModelActionId(null);
    }
  };

  if (definitionLoading) {
    return (
      <Flex direction="column" gap={24} className={styles.shell}>
        <Typography color="muted">Loading provider...</Typography>
      </Flex>
    );
  }

  if (!definition || !isPhase1ProviderId(providerId)) {
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

  const models = catalogModelsFromDefinition(definition);
  const openclawProviderId =
    definition.openclawProviderId ?? definition.id;
  const catalogSource =
    getCatalogSource(providerId) ??
    (definition.docsUrl
      ? {
          href: definition.docsUrl,
          label: definition.displayName,
          note: "Official model documentation.",
        }
      : undefined);
  const modelGroups = groupModelsByTier(models);
  const hasKey = connections.length > 0;
  const starterModels: ProviderStarterModel[] =
    definition.starterModels ?? [];

  return (
    <Flex direction="column" gap={24} className={styles.shell}>
      <BackButton href="/dashboard/ai-model">Back to Providers</BackButton>
      <ProviderHeader
        name={definition.displayName}
        iconSrc={uiMeta?.iconSrc}
        apiKeyUrl={definition.apiKeyUrl ?? uiMeta?.apiKeyUrl}
        apiKeyLabel={uiMeta?.apiKeyLabel}
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
        provider={{ name: definition.displayName }}
        mode={formMode}
        editingConn={editingConn}
        editKeyLoading={editKeyLoading}
        onSubmit={handleSave}
      />

      {isProxy ? (
        <>
          <Flex direction="column" gap={16} className={styles.modelsSection}>
            <Flex align="center" justify="between" wrap="wrap" gap={12}>
              <Typography variant="h3" weight="bold">
                Your models
              </Typography>
              <Button
                variant="primary"
                size="sm"
                disabled={!hasKey}
                onClick={() => openAddModelModal()}
              >
                Add model
              </Button>
            </Flex>
            <Typography variant="small" color="muted">
              Add OpenClaw model refs for this proxy. They sync to{" "}
              <code>openclaw.json</code> as the project allowlist.
            </Typography>

            {modelsLoading ? (
              <Typography variant="small" color="muted">
                Loading models...
              </Typography>
            ) : userModels.length === 0 ? (
              <Card disableHover className={styles.modelsWrapper}>
                <Typography variant="small" color="muted">
                  No models yet. Add one manually or pick a quick start below.
                </Typography>
              </Card>
            ) : (
              <Flex direction="column" gap={10}>
                {userModels.map((model) => (
                  <Card key={model.id} disableHover className={styles.userModelRow}>
                    <Flex align="center" justify="between" gap={12} wrap="wrap">
                      <Flex direction="column" gap={4}>
                        <code className={styles.userModelCode}>
                          {model.openclawId}
                        </code>
                        {model.displayName && (
                          <Typography variant="small" color="muted">
                            {model.displayName}
                          </Typography>
                        )}
                      </Flex>
                      <Flex align="center" gap={8}>
                        {model.isDefault ? (
                          <span className={styles.defaultBadge}>Default</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={modelActionId === model.id}
                            onClick={() => void handleSetDefaultModel(model.id)}
                          >
                            <Star size={14} />
                            Set default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={modelActionId === model.id}
                          onClick={() => void handleDeleteModel(model.id)}
                          aria-label="Delete model"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Flex>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            )}
          </Flex>

          {starterModels.length > 0 && (
            <Flex direction="column" gap={16} className={styles.modelsSection}>
              <Typography variant="h3" weight="bold">
                Quick start
              </Typography>
              <Typography variant="small" color="muted">
                Starter templates — click to pre-fill the add model form.
              </Typography>
              <Flex wrap="wrap" gap={10}>
                {starterModels.map((starter) => (
                  <Button
                    key={starter.openclawId}
                    variant="outline"
                    size="sm"
                    disabled={!hasKey}
                    onClick={() => openAddModelModal(starter.openclawId)}
                  >
                    {starter.name}
                  </Button>
                ))}
              </Flex>
            </Flex>
          )}

          <ModalAddModel
            isOpen={showAddModel}
            onClose={() => setShowAddModel(false)}
            providerName={definition.displayName}
            modelRefHint={definition.modelRefHint}
            defaultOpenclawId={addModelPreset}
            onSubmit={(data) => void handleAddModel(data)}
            submitting={addingModel}
          />
        </>
      ) : (
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
                  {t(TIER_KEYS[tier as keyof typeof TIER_KEYS] ?? tier)}
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
      )}

      <Box radius="md" className={styles.noteBox}>
        <Flex align="start" gap={6}>
          <Info size={16} className={styles.noteIcon} />
          <Typography variant="small" color="muted">
            {isProxy ? (
              <>
                <strong>Proxy providers</strong> store your model refs in the
                database and sync them to <code>openclaw.json</code>. Set a
                default model when adding or via the list above.
              </>
            ) : (
              <>
                <strong>Model catalog</strong> lives on the frontend/API
                (curated metadata). <strong>API keys</strong> are stored in the
                DB and synced to <code>openclaw.json</code>.
              </>
            )}
          </Typography>
        </Flex>
      </Box>
    </Flex>
  );
}
