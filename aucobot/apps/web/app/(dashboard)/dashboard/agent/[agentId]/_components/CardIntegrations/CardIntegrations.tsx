"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Flex } from "@/components/layout";
import { SearchItem } from "@/components/dashboard";
import {
  Typography,
  Input,
  Button,
  Switch,
  Card,
  IconProvider,
  CodeBlock,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import { toServiceConnectData } from "../../../../connector/connect-display";
import type { ServiceConnectData } from "../../../../connector/projectConnectData";
import { isProjectConnectorConnected } from "@/utils/connectors/project-connector-status";
import type { ConnectorDefinition, ProjectConnector } from "@/schemas/project.schema";
import {
  Copy,
  Plus,
  Trash2,
  Check,
  Code,
  Terminal,
  FileCode,
  ArrowUpRight,
  Rocket,
} from "lucide-react";
import { MOCK_AGENT_CHANNEL_TOOLS, MOCK_AGENT_CONNECTOR_TOOLS } from "../../../agentMockData";
import type { AgentApiKeyListItem } from "@/schemas/project.schema";
import {
  mergeChannelCatalog,
  type ChannelCatalogCard,
} from "@/utils/channels/merge-channel-catalog";
import { isChannelReadyForAgent } from "@/utils/channels/channel-agent-status";
import { useI18n } from "@/lib/i18n";
import styles from "./CardIntegrations.module.css";

interface CardIntegrationsProps {
  agentId: string;
}

type SnippetTab = "curl" | "node" | "python";

type ConnectorToolRow = {
  connector: ProjectConnector;
  service: ServiceConnectData;
  isConnected: boolean;
  isActive: boolean;
};

type ChannelAgentRow = ChannelCatalogCard & {
  isReady: boolean;
  agentEnabled: boolean;
};

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex justify="between" align="center" gap={4} className={styles.headerRow}>
      <div className={styles.header}>
        <Typography variant="p" weight="bold">
          {title}
        </Typography>
        <Typography variant="small" color="muted">
          {description}
        </Typography>
      </div>
      {action}
    </Flex>
  );
}

function ProviderRow({
  name,
  iconSrc,
  fallbackLabel,
  connected,
  active,
  onActiveChange,
  meta,
  trailing,
  enableAria,
}: {
  name: string;
  iconSrc?: string;
  fallbackLabel: string;
  connected: boolean;
  active: boolean;
  onActiveChange: () => void;
  meta: React.ReactNode;
  trailing?: React.ReactNode;
  enableAria: string;
}) {
  return (
    <div
      className={`${styles.providerRow} ${!connected ? styles.notConnected : ""}`}
    >
      <IconProvider
        src={iconSrc}
        alt={name}
        label={fallbackLabel}
        size="sm"
        withBackground
      />
      <div className={styles.providerInfo}>
        <Typography variant="p" weight="medium">
          {name}
        </Typography>
        <div className={styles.providerMeta}>{meta}</div>
      </div>
      {trailing}
      <Switch
        checked={active && connected}
        onCheckedChange={() => connected && onActiveChange()}
        disabled={!connected}
        aria-label={enableAria}
      />
    </div>
  );
}

export function CardIntegrations({ agentId }: CardIntegrationsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");

  const isAgentPersisted = Boolean(projectId && agentId && agentId !== "new-agent");

  const [apiKeys, setApiKeys] = useState<AgentApiKeyListItem[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dialogKeyName, setDialogKeyName] = useState("");
  const [createdKeyDialog, setCreatedKeyDialog] = useState<{
    label: string;
    token: string;
  } | null>(null);
  const [copiedCreatedToken, setCopiedCreatedToken] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const [snippetTab, setSnippetTab] = useState<SnippetTab>("curl");

  const [channelCatalog, setChannelCatalog] = useState<ChannelCatalogCard[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [enabledChannels, setEnabledChannels] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      MOCK_AGENT_CHANNEL_TOOLS.map((row) => [row.channelId, row.isActive]),
    ),
  );

  const [connectorSearch, setConnectorSearch] = useState("");
  const [projectConnectors, setProjectConnectors] = useState<ProjectConnector[]>([]);
  const [connectorDefinitions, setConnectorDefinitions] = useState<ConnectorDefinition[]>([]);
  const [connectorsLoading, setConnectorsLoading] = useState(false);
  const [connectorsError, setConnectorsError] = useState<string | null>(null);
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      MOCK_AGENT_CONNECTOR_TOOLS.map((row) => [row.connectorSlug, row.isActive]),
    ),
  );

  const loadProjectChannels = useCallback(async () => {
    if (!projectId) {
      setChannelCatalog([]);
      return;
    }
    setChannelsError(null);
    setChannelsLoading(true);
    try {
      const [definitions, rows] = await Promise.all([
        projectApi.listChannelDefinitions(),
        projectApi.listChannels(projectId),
      ]);
      setChannelCatalog(mergeChannelCatalog(definitions, rows));
    } catch (err) {
      setChannelsError(
        err instanceof Error ? err.message : t("agent.integrations.errors.loadChannels"),
      );
    } finally {
      setChannelsLoading(false);
    }
  }, [projectId]);

  const loadProjectConnectors = useCallback(async () => {
    if (!projectId) {
      setProjectConnectors([]);
      return;
    }
    setConnectorsError(null);
    setConnectorsLoading(true);
    try {
      const [definitions, connectors] = await Promise.all([
        projectApi.listConnectorDefinitions(),
        projectApi.listConnectors(projectId),
      ]);
      setConnectorDefinitions(definitions);
      setProjectConnectors(connectors);
    } catch (err) {
      setConnectorsError(
        err instanceof Error ? err.message : t("agent.integrations.errors.loadConnectors"),
      );
    } finally {
      setConnectorsLoading(false);
    }
  }, [projectId]);

  const loadAgentApiKeys = useCallback(async () => {
    if (!isAgentPersisted) {
      setApiKeys([]);
      return;
    }
    setApiKeysError(null);
    setApiKeysLoading(true);
    try {
      const items = await projectApi.listAgentApiKeys(projectId, agentId);
      setApiKeys(items);
    } catch (err) {
      setApiKeysError(
        err instanceof Error ? err.message : t("agent.integrations.errors.loadApiKeys"),
      );
    } finally {
      setApiKeysLoading(false);
    }
  }, [isAgentPersisted, projectId, agentId]);

  useEffect(() => {
    void loadProjectChannels();
    void loadProjectConnectors();
    void loadAgentApiKeys();
  }, [loadProjectChannels, loadProjectConnectors, loadAgentApiKeys]);

  useEffect(() => {
    setEnabledChannels((prev) => {
      const next = { ...prev };
      for (const channel of channelCatalog) {
        if (next[channel.channelId] !== undefined) {
          continue;
        }
        const mock = MOCK_AGENT_CHANNEL_TOOLS.find(
          (row) => row.channelId === channel.channelId,
        );
        next[channel.channelId] = mock?.isActive ?? false;
      }
      return next;
    });
  }, [channelCatalog]);

  useEffect(() => {
    setEnabledTools((prev) => {
      const next = { ...prev };
      for (const connector of projectConnectors) {
        if (next[connector.connectorSlug] !== undefined) {
          continue;
        }
        const mock = MOCK_AGENT_CONNECTOR_TOOLS.find(
          (row) => row.connectorSlug === connector.connectorSlug,
        );
        next[connector.connectorSlug] = mock?.isActive ?? false;
      }
      return next;
    });
  }, [projectConnectors]);

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setDialogKeyName("");
  };

  const openCreateDialog = () => {
    setDialogKeyName("");
    setCreateDialogOpen(true);
  };

  const handleGenerateKey = async () => {
    const label = dialogKeyName.trim();
    if (!label || !isAgentPersisted) {
      return;
    }
    setIsGenerating(true);
    setApiKeysError(null);
    try {
      const created = await projectApi.createAgentApiKey(projectId, agentId, { label });
      closeCreateDialog();
      setCreatedKeyDialog({ label: created.label, token: created.token });
      setCopiedCreatedToken(false);
      await loadAgentApiKeys();
    } catch (err) {
      setApiKeysError(
        err instanceof Error ? err.message : t("agent.integrations.errors.createApiKey"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!isAgentPersisted) {
      return;
    }
    setDeletingKeyId(keyId);
    setApiKeysError(null);
    try {
      await projectApi.revokeAgentApiKey(projectId, agentId, keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      setApiKeysError(
        err instanceof Error ? err.message : t("agent.integrations.errors.revokeApiKey"),
      );
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleCopyCreatedToken = () => {
    if (!createdKeyDialog) {
      return;
    }
    void navigator.clipboard.writeText(createdKeyDialog.token);
    setCopiedCreatedToken(true);
    setTimeout(() => setCopiedCreatedToken(false), 2000);
  };

  const formatKeyDate = (iso: string) => iso.split("T")[0] ?? iso;

  const toggleChannel = (channelId: string) => {
    setEnabledChannels((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  };

  const toggleConnectorTool = (slug: string) => {
    setEnabledTools((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  const activeToken = apiKeys[0]?.tokenPrefix
    ? `${apiKeys[0].tokenPrefix}…`
    : "sk-claw-your-api-token";

  const channelAgentRows = useMemo((): ChannelAgentRow[] => {
    return channelCatalog.map((channel) => ({
      ...channel,
      isReady: channel.isActive && isChannelReadyForAgent(channel),
      agentEnabled: enabledChannels[channel.channelId] ?? false,
    }));
  }, [channelCatalog, enabledChannels]);

  const definitionBySlug = useMemo(
    () => new Map(connectorDefinitions.map((def) => [def.slug, def])),
    [connectorDefinitions],
  );

  const connectorToolRows = useMemo((): ConnectorToolRow[] => {
    return projectConnectors.map((connector) => {
      const def = definitionBySlug.get(connector.connectorSlug);
      const service: ServiceConnectData = def
        ? toServiceConnectData(def)
        : {
            id: connector.connectorSlug,
            name: connector.displayName || connector.connectorName,
            slug: connector.connectorSlug,
            type: connector.connectorKind,
            author: t("agent.integrations.thirdParty"),
            description: connector.definition?.description ?? "",
          };

      return {
        connector,
        service,
        isConnected: isProjectConnectorConnected(connector),
        isActive: enabledTools[connector.connectorSlug] ?? false,
      };
    });
  }, [projectConnectors, definitionBySlug, enabledTools]);

  const filteredConnectorRows = useMemo(() => {
    const query = connectorSearch.trim().toLowerCase();
    if (!query) {
      return connectorToolRows;
    }
    return connectorToolRows.filter((row) => {
      const haystack = [
        row.service.name,
        row.service.slug,
        row.service.type,
        row.connector.displayName,
        row.connector.connectorName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [connectorToolRows, connectorSearch]);

  const snippets: Record<SnippetTab, string> = {
    curl: `curl -X POST https://api.openclaw-saas.com/v1/chat/completions \\
  -H "Authorization: Bearer ${activeToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${agentId}","messages":[{"role":"user","content":"Hello!"}]}'`,
    node: `const res = await fetch("https://api.openclaw-saas.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${activeToken}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "${agentId}",
    messages: [{ role: "user", content: "Hello!" }]
  })
});
const data = await res.json();
console.log(data.choices[0].message.content);`,
    python: `import requests

response = requests.post(
    "https://api.openclaw-saas.com/v1/chat/completions",
    headers={"Authorization": "Bearer ${activeToken}"},
    json={
        "model": "${agentId}",
        "messages": [{"role": "user", "content": "Hello!"}]
    }
)
print(response.json()["choices"][0]["message"]["content"])`,
  };

  const widgetScript = `<script src="https://cdn.openclaw.io/widget.js"
  data-agent-id="${agentId}"
  data-token="${activeToken.substring(0, 18)}..."
  defer></script>`;

  return (
    <div className={styles.stack}>
      <Card className={styles.card} disableHover>
        <SectionHeader
          title={t("agent.integrations.apiKeys.title")}
          description={t("agent.integrations.apiKeys.description")}
          action={
            <Button
              type="button"
              size="sm"
              onClick={openCreateDialog}
              disabled={!isAgentPersisted}
            >
              <Plus size={14} aria-hidden />
              {t("agent.integrations.apiKeys.create")}
            </Button>
          }
        />

        {!isAgentPersisted ? (
          <Typography variant="small" color="muted" className={styles.emptyTable}>
            {t("agent.integrations.apiKeys.saveFirst")}
          </Typography>
        ) : apiKeysLoading ? (
          <div className={styles.apiKeysLoading}>
            <Spinner size="sm" />
          </div>
        ) : apiKeysError ? (
          <Typography variant="small" className={styles.apiKeysError}>
            {apiKeysError}
          </Typography>
        ) : apiKeys.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyTable}>
            {t("agent.integrations.apiKeys.empty")}
          </Typography>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t("agent.integrations.apiKeys.headers.name")}</th>
                  <th>{t("agent.integrations.apiKeys.headers.token")}</th>
                  <th>{t("agent.integrations.apiKeys.headers.created")}</th>
                  <th className={styles.colActions}>
                    {t("agent.integrations.apiKeys.headers.delete")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className={styles.keyName}>{key.label}</td>
                    <td>
                      <span className={styles.tokenText}>{key.tokenPrefix}…</span>
                    </td>
                    <td className={styles.keyDate}>{formatKeyDate(key.createdAt)}</td>
                    <td className={styles.colActions}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        loading={deletingKeyId === key.id}
                        onClick={() => void handleRevokeKey(key.id)}
                        aria-label={t("agent.integrations.apiKeys.deleteAria", {
                          name: key.label,
                        })}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </Card>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => !open && closeCreateDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agent.integrations.apiKeys.createDialog.title")}</DialogTitle>
          </DialogHeader>
          <form
            className={styles.dialogForm}
            onSubmit={(e) => {
              e.preventDefault();
              void handleGenerateKey();
            }}
          >
            <Input
              id="new-api-key-name"
              label={t("agent.integrations.apiKeys.createDialog.nameLabel")}
              placeholder={t("agent.integrations.apiKeys.createDialog.namePlaceholder")}
              value={dialogKeyName}
              onChange={(e) => setDialogKeyName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeCreateDialog}
              >
                {t("agent.integrations.apiKeys.createDialog.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isGenerating}
                disabled={!dialogKeyName.trim()}
              >
                {t("agent.integrations.apiKeys.createDialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createdKeyDialog !== null}
        onOpenChange={(open) => !open && setCreatedKeyDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agent.integrations.apiKeys.createdDialog.title")}</DialogTitle>
          </DialogHeader>
          <Typography variant="small" color="muted">
            {t("agent.integrations.apiKeys.createdDialog.description")}
          </Typography>
          {createdKeyDialog ? (
            <div className={styles.createdTokenRow}>
              <code className={styles.createdToken}>{createdKeyDialog.token}</code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                onClick={handleCopyCreatedToken}
                aria-label={t("agent.integrations.apiKeys.createdDialog.copyAria")}
              >
                {copiedCreatedToken ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCreatedKeyDialog(null)}
            >
              {t("agent.integrations.apiKeys.createdDialog.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className={styles.card} disableHover>
        <SectionHeader
          title={t("agent.integrations.widget.title")}
          description={t("agent.integrations.widget.description")}
        />

        <CodeBlock
          title={t("agent.integrations.widget.scriptTitle")}
          icon={<Rocket size={16} aria-hidden />}
          code={widgetScript}
        />

        <CodeBlock
          code={snippets[snippetTab]}
          tabs={[
            { value: "curl", label: t("agent.integrations.widget.curl"), icon: <Terminal size={12} aria-hidden /> },
            { value: "node", label: t("agent.integrations.widget.node"), icon: <Code size={12} aria-hidden /> },
            { value: "python", label: t("agent.integrations.widget.python"), icon: <FileCode size={12} aria-hidden /> },
          ]}
          activeTab={snippetTab}
          onTabChange={setSnippetTab}
        />
      </Card>

      <Card className={styles.card} disableHover>
        <SectionHeader
          title={t("agent.integrations.channels.title")}
          description={t("agent.integrations.channels.description")}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/channel")}
            >
              <ArrowUpRight size={14} aria-hidden />
              {t("agent.integrations.channels.manage")}
            </Button>
          }
        />

        {channelsError ? (
          <Typography variant="small" color="muted" className={styles.connectorsError}>
            {channelsError}
          </Typography>
        ) : null}

        {channelsLoading ? (
          <Flex justify="center" align="center" className={styles.connectorsLoading}>
            <Spinner size="md" />
          </Flex>
        ) : channelAgentRows.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyConnectors}>
            {t("agent.integrations.channels.empty")}
          </Typography>
        ) : (
          <div className={styles.providerList}>
            {channelAgentRows.map((channel) => (
              <ProviderRow
                key={channel.channelId}
                name={channel.name}
                iconSrc={channel.iconSrc}
                fallbackLabel={channel.iconLabel ?? channel.name}
                connected={channel.isReady}
                active={channel.agentEnabled}
                onActiveChange={() => toggleChannel(channel.channelId)}
                enableAria={t("agent.integrations.channels.enableAria", {
                  name: channel.name,
                })}
                meta={
                  !channel.isActive ? (
                    <span className={styles.statusMuted}>
                      {t("agent.integrations.channels.comingSoon")}
                    </span>
                  ) : channel.isReady ? (
                    <span className={styles.statusOk}>{channel.statusLabel}</span>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className={styles.connectLink}
                      onClick={() =>
                        router.push(`/dashboard/channel/${channel.channelId}`)
                      }
                    >
                      {t("agent.integrations.channels.notConnected")}
                    </Button>
                  )
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Card className={styles.card} disableHover>
        <SectionHeader
          title={t("agent.integrations.connectors.title")}
          description={t("agent.integrations.connectors.description")}
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/connector")}
            >
              <ArrowUpRight size={14} aria-hidden />
              {t("agent.integrations.connectors.manage")}
            </Button>
          }
        />

        <SearchItem
          id="connector-tool-search"
          value={connectorSearch}
          onChange={setConnectorSearch}
          placeholder={t("agent.integrations.connectors.searchPlaceholder")}
          className={styles.connectorSearch}
          maxWidth="100%"
        />

        {connectorsError ? (
          <Typography variant="small" color="muted" className={styles.connectorsError}>
            {connectorsError}
          </Typography>
        ) : null}

        {connectorsLoading ? (
          <Flex justify="center" align="center" className={styles.connectorsLoading}>
            <Spinner size="md" />
          </Flex>
        ) : projectConnectors.length === 0 ? (
          <div className={styles.emptyConnectors}>
            <Typography variant="small" color="muted">
              {t("agent.integrations.connectors.empty")}
            </Typography>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/connector")}
            >
              {t("agent.integrations.connectors.goToConnect")}
            </Button>
          </div>
        ) : filteredConnectorRows.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyConnectors}>
            {t("agent.integrations.connectors.noMatch")}
          </Typography>
        ) : (
          <div className={styles.providerList}>
            {filteredConnectorRows.map(({ connector, service, isConnected, isActive }) => (
              <ProviderRow
                key={connector.id}
                name={service.name}
                iconSrc={service.iconSrc}
                fallbackLabel={service.name}
                connected={isConnected}
                active={isActive}
                onActiveChange={() => toggleConnectorTool(service.slug)}
                enableAria={t("agent.integrations.channels.enableAria", {
                  name: service.name,
                })}
                meta={
                  <>
                    <span className={styles.typeBadge}>{service.type}</span>
                    {isConnected ? (
                      <span className={styles.statusOk}>
                        {t("agent.integrations.connectors.connected")}
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className={styles.connectLink}
                        onClick={() =>
                          router.push(`/dashboard/connector/${service.slug}`)
                        }
                      >
                        {t("agent.integrations.connectors.notConnected")}
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
