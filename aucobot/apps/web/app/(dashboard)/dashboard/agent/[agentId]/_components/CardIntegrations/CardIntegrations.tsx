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
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useProjectStore } from "@/stores/project.store";
import { toServiceConnectData } from "../../../../connect/connect-display";
import type { ServiceConnectData } from "../../../../connect/projectConnectData";
import { isProjectConnectorConnected } from "@/lib/connectors/project-connector-status";
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
import {
  MOCK_API_KEYS,
  type ApiKeyItem,
  MOCK_AGENT_CHANNEL_TOOLS,
  MOCK_AGENT_CONNECTOR_TOOLS,
} from "../../../agentMockData";
import {
  mergeChannelCatalog,
  type ChannelCatalogCard,
} from "@/lib/channels/merge-channel-catalog";
import { isChannelReadyForAgent } from "@/lib/channels/channel-agent-status";
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
    <Flex justify="between" align="start" gap={4} className={styles.headerRow}>
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
}: {
  name: string;
  iconSrc?: string;
  fallbackLabel: string;
  connected: boolean;
  active: boolean;
  onActiveChange: () => void;
  meta: React.ReactNode;
  trailing?: React.ReactNode;
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
        aria-label={`Enable ${name}`}
      />
    </div>
  );
}

export function CardIntegrations({ agentId }: CardIntegrationsProps) {
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projects[0]?.id ?? "");

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(MOCK_API_KEYS);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
        err instanceof Error ? err.message : "Không tải được danh sách kênh",
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
        err instanceof Error ? err.message : "Không tải được danh sách connector",
      );
    } finally {
      setConnectorsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProjectChannels();
    void loadProjectConnectors();
  }, [loadProjectChannels, loadProjectConnectors]);

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

  const handleGenerateKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const name = newKeyName.trim() || `API Key #${apiKeys.length + 1}`;
      const hex = Array.from({ length: 24 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("");
      setApiKeys((prev) => [
        ...prev,
        {
          id: `key-${Date.now()}`,
          name,
          token: `sk-claw-${hex}`,
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
      setNewKeyName("");
      setIsGenerating(false);
    }, 800);
  };

  const handleCopyKey = (id: string, token: string) => {
    void navigator.clipboard.writeText(token);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

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

  const activeToken = apiKeys[0]?.token ?? "sk-claw-your-api-token";

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
            author: "Third party",
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
          title="API keys"
          description="Access tokens for external apps to call this agent via REST API."
        />

        {apiKeys.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyTable}>
            No API keys yet.
          </Typography>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Token</th>
                  <th>Created</th>
                  <th className={styles.colActions}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className={styles.keyName}>{key.name}</td>
                    <td>
                      <div className={styles.tokenCell}>
                        <span className={styles.tokenText}>
                          {key.token.substring(0, 18)}…
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon_sm"
                          onClick={() => handleCopyKey(key.id, key.token)}
                          aria-label={`Copy token ${key.name}`}
                        >
                          {copiedKeyId === key.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className={styles.keyDate}>{key.createdAt}</td>
                    <td className={styles.colActions}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon_sm"
                        onClick={() =>
                          setApiKeys((prev) => prev.filter((k) => k.id !== key.id))
                        }
                        aria-label={`Delete ${key.name}`}
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

        <Flex align="end" gap={3} className={styles.createRow}>
          <Input
            id="new-api-key-name"
            label="New key label"
            placeholder="e.g. CRM integration"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className={styles.createInput}
          />
          <Button
            type="button"
            size="sm"
            loading={isGenerating}
            onClick={handleGenerateKey}
          >
            <Plus size={14} aria-hidden />
            Create API key
          </Button>
        </Flex>
      </Card>

      <Card className={styles.card} disableHover>
        <SectionHeader
          title="Widget embed & REST API"
          description="Embed a chat bubble on your site or call the OpenAI-compatible REST API."
        />

        <CodeBlock
          title="Chat widget script"
          icon={<Rocket size={16} aria-hidden />}
          code={widgetScript}
        />

        <CodeBlock
          code={snippets[snippetTab]}
          tabs={[
            { value: "curl", label: "cURL", icon: <Terminal size={12} aria-hidden /> },
            { value: "node", label: "Node.js", icon: <Code size={12} aria-hidden /> },
            { value: "python", label: "Python", icon: <FileCode size={12} aria-hidden /> },
          ]}
          activeTab={snippetTab}
          onTabChange={setSnippetTab}
        />
      </Card>

      <Card className={styles.card} disableHover>
        <SectionHeader
          title="Messaging channels"
          description="All project channels from the Channel tab. Enable each channel for this agent after it is connected."
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/channel")}
            >
              <ArrowUpRight size={14} aria-hidden />
              Manage channels
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
            No channels available on this project.
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
                meta={
                  !channel.isActive ? (
                    <span className={styles.statusMuted}>Coming soon</span>
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
                      Not connected — configure
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
          title="Data sources & tools"
          description="Choose which connectors added in Connect this agent may call as tools. Permissions are configured on each connector in Connect."
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/connect")}
            >
              <ArrowUpRight size={14} aria-hidden />
              Manage connectors
            </Button>
          }
        />

        <SearchItem
          id="connector-tool-search"
          value={connectorSearch}
          onChange={setConnectorSearch}
          placeholder="Search connectors..."
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
              No connectors added yet. Add connectors in Connect, then enable them for this agent.
            </Typography>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/connect")}
            >
              Go to Connect
            </Button>
          </div>
        ) : filteredConnectorRows.length === 0 ? (
          <Typography variant="small" color="muted" className={styles.emptyConnectors}>
            No connectors match your search.
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
                meta={
                  <>
                    <span className={styles.typeBadge}>{service.type}</span>
                    {isConnected ? (
                      <span className={styles.statusOk}>Connected</span>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className={styles.connectLink}
                        onClick={() =>
                          router.push(`/dashboard/connect/${service.slug}`)
                        }
                      >
                        Not connected — connect now
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
