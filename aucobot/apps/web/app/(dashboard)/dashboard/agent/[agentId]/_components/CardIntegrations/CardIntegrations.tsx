"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Flex } from "@/components/layout";
import { Typography, Input, Button, Switch } from "@/components/ui";
import {
  Key, Copy, Plus, Trash2, Check,
  Code, Terminal, FileCode, ArrowUpRight,
  MessageSquare, Database,
} from "lucide-react";
import {
  MOCK_API_KEYS, ApiKeyItem,
  MOCK_AGENT_CHANNELS, AgentChannelAssignment,
  MOCK_AGENT_CONNECTORS, AgentConnectorAssignment,
  ConnectorPermission,
} from "../../../agentMockData";
import {
  CHANNEL_PROVIDERS, type ChannelData,
} from "../../../../channel/providerChannelData";
import {
  CONNECT_SERVICES, type ServiceConnectData,
} from "../../../../connect/projectConnectData";
import styles from "./CardIntegrations.module.css";

interface CardIntegrationsProps {
  agentId: string;
}

export function CardIntegrations({ agentId }: CardIntegrationsProps) {
  const router = useRouter();

  // ── API Keys ────────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(MOCK_API_KEYS);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Code snippet tabs ───────────────────────────────────────────────────
  const [snippetTab, setSnippetTab] = useState<"curl" | "node" | "python">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isCopiedWidget, setIsCopiedWidget] = useState(false);

  // ── Channel assignments ─────────────────────────────────────────────────
  const [channelAssignments, setChannelAssignments] = useState<AgentChannelAssignment[]>(MOCK_AGENT_CHANNELS);

  // ── Connector assignments ───────────────────────────────────────────────
  const [connectorAssignments, setConnectorAssignments] = useState<AgentConnectorAssignment[]>(MOCK_AGENT_CONNECTORS);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const handleGenerateKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const name = newKeyName.trim() || `API Key #${apiKeys.length + 1}`;
      const hex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setApiKeys(prev => [...prev, {
        id: `key-${Date.now()}`,
        name,
        token: `sk-claw-${hex}`,
        createdAt: new Date().toISOString().split("T")[0],
      }]);
      setNewKeyName("");
      setIsGenerating(false);
    }, 800);
  };

  const handleCopy = (text: string, cb: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    cb(true);
    setTimeout(() => cb(false), 2000);
  };

  const handleCopyKey = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleChannel = (channelId: string) => {
    setChannelAssignments(prev => prev.map(a =>
      a.channelId === channelId ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const toggleConnector = (slug: string) => {
    setConnectorAssignments(prev => prev.map(a =>
      a.connectorSlug === slug ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const toggleConnectorChat = (slug: string) => {
    setConnectorAssignments(prev => prev.map(a =>
      a.connectorSlug === slug ? { ...a, chatEnabled: !a.chatEnabled } : a
    ));
  };

  const setConnectorPermission = (slug: string, permission: ConnectorPermission) => {
    setConnectorAssignments(prev => prev.map(a =>
      a.connectorSlug === slug ? { ...a, permission } : a
    ));
  };

  // ── Derived data ────────────────────────────────────────────────────────
  const activeToken = apiKeys[0]?.token ?? "sk-claw-your-api-token";

  // Pure messaging channels
  const channelRows: { channel: ChannelData; assignment: AgentChannelAssignment | undefined }[] =
    CHANNEL_PROVIDERS.map((ch: ChannelData) => ({
      channel: ch,
      assignment: channelAssignments.find((a: AgentChannelAssignment) => a.channelId === ch.id),
    }));

  // E-commerce connectors with hasChat (shown in messaging section)
  const ecommerceRows: { service: ServiceConnectData; assignment: AgentConnectorAssignment | undefined }[] =
    CONNECT_SERVICES
      .filter((s: ServiceConnectData) => s.hasChat)
      .map((svc: ServiceConnectData) => ({
        service: svc,
        assignment: connectorAssignments.find((a: AgentConnectorAssignment) => a.connectorSlug === svc.slug),
      }));

  // Pure data/tool connectors (no hasChat)
  const dataConnectorRows: { service: ServiceConnectData; assignment: AgentConnectorAssignment | undefined }[] =
    CONNECT_SERVICES
      .filter((s: ServiceConnectData) => !s.hasChat)
      .map((svc: ServiceConnectData) => ({
        service: svc,
        assignment: connectorAssignments.find((a: AgentConnectorAssignment) => a.connectorSlug === svc.slug),
      }));

  const snippets = {
    curl: `curl -X POST https://api.openclaw-saas.com/v1/chat/completions \\
  -H "Authorization: Bearer ${activeToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${agentId}","messages":[{"role":"user","content":"Xin chào!"}]}'`,
    node: `const res = await fetch("https://api.openclaw-saas.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${activeToken}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "${agentId}",
    messages: [{ role: "user", content: "Xin chào!" }]
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
        "messages": [{"role": "user", "content": "Xin chào!"}]
    }
)
print(response.json()["choices"][0]["message"]["content"])`,
  };

  const widgetScript = `<script src="https://cdn.openclaw.io/widget.js"
  data-agent-id="${agentId}"
  data-token="${activeToken.substring(0, 18)}..."
  defer></script>`;

  return (
    <div className={styles.container}>

      {/* ── SECTION 1: API Keys ─────────────────────────────────────────── */}
      <div className={styles.section}>
        <Typography variant="p" weight="bold">🔑 Quản Lý API Keys</Typography>
        <Typography variant="small" color="muted" style={{ marginBottom: 16 }}>
          Access token để ứng dụng bên ngoài xác thực và gọi Agent này qua REST API.
        </Typography>

        <div className={styles.tableWrapper}>
          {apiKeys.length === 0 ? (
            <div className={styles.emptyState}>Chưa có API Key nào.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Token</th>
                  <th>Ngày tạo</th>
                  <th style={{ width: 56, textAlign: "center" }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(key => (
                  <tr key={key.id}>
                    <td className={styles.keyName}>{key.name}</td>
                    <td>
                      <div className={styles.tokenContainer}>
                        <span className={styles.tokenText}>{key.token.substring(0, 18)}...</span>
                        <button className={styles.copyBtn} onClick={() => handleCopyKey(key.id, key.token)}>
                          {copiedKeyId === key.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td className={styles.keyDate}>{key.createdAt}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className={styles.deleteBtn} onClick={() => setApiKeys(apiKeys.filter(k => k.id !== key.id))}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Flex gap={3} align="center" style={{ marginTop: 14 }}>
          <Input
            placeholder="Tên gợi nhớ (VD: CRM Integration...)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <Button size="sm" className={styles.generateBtn} loading={isGenerating} onClick={handleGenerateKey}>
            <Plus size={14} /> Tạo API Key
          </Button>
        </Flex>
      </div>

      {/* ── SECTION 2: Widget & Code Snippets ──────────────────────────── */}
      <div className={styles.section}>
        <Typography variant="p" weight="bold">🚀 Nhúng Widget & REST API</Typography>
        <Typography variant="small" color="muted" style={{ marginBottom: 16 }}>
          Nhúng bong bóng chat vào website hoặc gọi trực tiếp qua REST API chuẩn OpenAI.
        </Typography>

        <div className={styles.widgetBox}>
          <Flex justify="between" align="center" style={{ marginBottom: 8 }}>
            <Typography variant="small" weight="bold">🌐 Script nhúng Chat Widget</Typography>
            <Button variant="ghost" size="sm" style={{ gap: 4, height: 26, fontSize: 12, padding: "0 8px" }}
              onClick={() => handleCopy(widgetScript, setIsCopiedWidget)}>
              {isCopiedWidget ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              {isCopiedWidget ? "Đã copy!" : "Copy"}
            </Button>
          </Flex>
          <pre className={styles.codeBlock}>{widgetScript}</pre>
        </div>

        <div className={styles.snippetContainer}>
          <div className={styles.snippetTabs}>
            {([
              { id: "curl", label: "cURL", icon: <Terminal size={12} /> },
              { id: "node", label: "Node.js", icon: <Code size={12} /> },
              { id: "python", label: "Python", icon: <FileCode size={12} /> },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setSnippetTab(tab.id)}
                className={`${styles.snippetTabBtn} ${snippetTab === tab.id ? styles.activeTab : ""}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
          <div className={styles.snippetBody}>
            <button className={styles.snippetCopyBtn}
              onClick={() => handleCopy(snippets[snippetTab], setCopiedSnippet)}>
              {copiedSnippet ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              {copiedSnippet ? "Đã copy!" : "Copy"}
            </button>
            <pre className={styles.codeBlock}>{snippets[snippetTab]}</pre>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Messaging Channels (pure chat + ecommerce hasChat) ─ */}
      <div className={styles.section}>
        <Flex justify="between" align="center" style={{ marginBottom: 4 }}>
          <Typography variant="p" weight="bold" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={16} />
            Kênh Nhắn Tin
          </Typography>
          <Button variant="ghost" size="sm" style={{ gap: 5, fontSize: 12 }}
            onClick={() => router.push(`/dashboard/channel`)}>
            <ArrowUpRight size={13} /> Quản lý tab Channel
          </Button>
        </Flex>
        <Typography variant="small" color="muted" style={{ marginBottom: 16 }}>
          Agent sẽ tự động lắng nghe và trả lời tin nhắn trên các kênh bạn bật. Kênh cần được cấu hình trước ở <strong>tab Channel</strong> của dự án.
        </Typography>

        <div className={styles.providerList}>
          {/* Pure messaging channels */}
          {channelRows.map(({ channel, assignment }) => {
            const isConnected = assignment?.isConnectedAtProject ?? false;
            const isActive = assignment?.isActive ?? false;
            return (
              <div key={channel.id} className={`${styles.providerRow} ${!isConnected ? styles.notConnected : ""}`}>
                <div className={styles.providerIcon} style={{ background: `${channel.color}18`, border: `1px solid ${channel.color}33` }}>
                  {channel.iconSrc
                    ? <img src={channel.iconSrc} alt={channel.name} width={20} height={20} style={{ objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <MessageSquare size={16} color={channel.color} />
                  }
                </div>
                <div className={styles.providerInfo}>
                  <span className={styles.providerName}>{channel.name}</span>
                  {isConnected
                    ? <span className={styles.connectedTag}>Đã cấu hình</span>
                    : <button className={styles.goConnectBtn}
                        onClick={() => router.push(`/dashboard/channel`)}>
                        Chưa kết nối → Cấu hình ngay
                      </button>
                  }
                </div>
                <Switch
                  checked={isActive && isConnected}
                  onCheckedChange={() => isConnected && toggleChannel(channel.id)}
                  disabled={!isConnected}
                />
              </div>
            );
          })}

          {/* E-commerce platforms with hasChat (Shopee, TikTok Shop) */}
          {ecommerceRows.length > 0 && (
            <>
              <div className={styles.subGroupLabel}>
                <span>🛒 Nền tảng thương mại điện tử</span>
                <Button variant="ghost" size="sm" style={{ gap: 4, fontSize: 11 }}
                  onClick={() => router.push(`/dashboard/connect`)}>
                  <ArrowUpRight size={12} /> tab Connect
                </Button>
              </div>
              {ecommerceRows.map(({ service, assignment }) => {
                const isConnected = assignment?.isConnectedAtProject ?? false;
                const isActive = assignment?.isActive ?? false;
                const chatOn = assignment?.chatEnabled ?? false;
                return (
                  <div key={service.id} className={`${styles.providerRow} ${styles.ecommerceRow} ${!isConnected ? styles.notConnected : ""}`}>
                    <div className={styles.providerIcon} style={{ background: "#f97316" + "18", border: "1px solid #f9731633" }}>
                      {service.iconSrc
                        ? <img src={service.iconSrc} alt={service.name} width={20} height={20} style={{ objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <MessageSquare size={16} color="#f97316" />
                      }
                    </div>
                    <div className={styles.providerInfo}>
                      <span className={styles.providerName}>{service.name}</span>
                      {isConnected
                        ? <Flex gap={6} align="center">
                            <span className={styles.connectedTag}>OAuth ✓</span>
                            {isActive && (
                              <label className={styles.chatToggleLabel}>
                                <input type="checkbox" checked={chatOn}
                                  onChange={() => toggleConnectorChat(service.slug)}
                                  className={styles.chatToggleInput} />
                                Chat {chatOn ? "bật" : "tắt"}
                              </label>
                            )}
                          </Flex>
                        : <button className={styles.goConnectBtn}
                            onClick={() => router.push(`/dashboard/connect`)}>
                            Chưa kết nối → OAuth ngay
                          </button>
                      }
                    </div>
                    <Switch
                      checked={isActive && isConnected}
                      onCheckedChange={() => isConnected && toggleConnector(service.slug)}
                      disabled={!isConnected}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ── SECTION 4: Data & Tool Connectors ──────────────────────────── */}
      <div className={styles.section}>
        <Flex justify="between" align="center" style={{ marginBottom: 4 }}>
          <Typography variant="p" weight="bold" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Database size={16} />
            Nguồn Dữ Liệu & Công Cụ
          </Typography>
          <Button variant="ghost" size="sm" style={{ gap: 5, fontSize: 12 }}
            onClick={() => router.push(`/dashboard/connect`)}>
            <ArrowUpRight size={13} /> Quản lý tab Connect
          </Button>
        </Flex>
        <Typography variant="small" color="muted" style={{ marginBottom: 16 }}>
          Agent có thể đọc/ghi dữ liệu từ các dịch vụ đã kết nối OAuth. Phân quyền có thể điều chỉnh từng connector.
        </Typography>

        <div className={styles.providerList}>
          {dataConnectorRows.map(({ service, assignment }) => {
            const isConnected = assignment?.isConnectedAtProject ?? false;
            const isActive = assignment?.isActive ?? false;
            const perm = assignment?.permission ?? "read";
            return (
              <div key={service.id} className={`${styles.providerRow} ${!isConnected ? styles.notConnected : ""}`}>
                <div className={styles.providerIcon}>
                  {service.iconSrc
                    ? <img src={service.iconSrc} alt={service.name} width={20} height={20} style={{ objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <Database size={16} color="var(--text-secondary)" />
                  }
                </div>
                <div className={styles.providerInfo}>
                  <Flex align="center" gap={6}>
                    <span className={styles.providerName}>{service.name}</span>
                    <span className={styles.typeBadge}>{service.type}</span>
                  </Flex>
                  {isConnected
                    ? isActive && (
                        <select
                          className={styles.permSelect}
                          value={perm}
                          onChange={e => setConnectorPermission(service.slug, e.target.value as ConnectorPermission)}>
                          <option value="read">Chỉ đọc</option>
                          <option value="write">Đọc + Ghi</option>
                          <option value="full">Toàn quyền</option>
                        </select>
                      )
                    : <button className={styles.goConnectBtn}
                        onClick={() => router.push(`/dashboard/connect/${service.slug}`)}>
                        Chưa kết nối → Kết nối ngay
                      </button>
                  }
                </div>
                <Switch
                  checked={isActive && isConnected}
                  onCheckedChange={() => isConnected && toggleConnector(service.slug)}
                  disabled={!isConnected}
                />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
