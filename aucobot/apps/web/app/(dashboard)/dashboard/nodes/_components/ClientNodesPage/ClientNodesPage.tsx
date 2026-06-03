"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { projectApi } from "@/lib/api/project";
import { resolveOssGatewayHttpBase } from "@/lib/gateway-control-ui";
import { isCloudRuntime } from "@/lib/runtime-mode";
import { DASHBOARD_BASE_PATH } from "@/lib/dashboard-route";
import type {
  DevicePairingPending,
  NodeEntry,
  NodeInviteListItem,
  NodesPairingResponse,
} from "@/schemas/nodes.schema";
import { Flex } from "@/components/layout";
import { Button, Card, Input, Spinner, Typography } from "@/components/ui";
import styles from "./ClientNodesPage.module.css";
import pageStyles from "../../nodes.module.css";

const POLL_MS = 12_000;

function isNodeDeviceRequest(req: DevicePairingPending): boolean {
  const role = req.role?.trim().toLowerCase();
  if (role === "node") return true;
  return (req.roles ?? []).some((r) => r.trim().toLowerCase() === "node");
}

function formatCaps(values: unknown[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => String(v)).filter(Boolean).slice(0, 12);
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

interface ClientNodesPageProps {
  projectId: string;
}

export default function ClientNodesPage({ projectId }: ClientNodesPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeEntry[]>([]);
  const [pairing, setPairing] = useState<NodesPairingResponse | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [invites, setInvites] = useState<NodeInviteListItem[]>([]);
  const [latestInviteCode, setLatestInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const gatewayHttpBase = useMemo(
    () => (isCloudRuntime() ? null : resolveOssGatewayHttpBase()),
    [],
  );

  const load = useCallback(async () => {
    if (!projectId) return;

    const [listRes, pairingRes, inviteRes] = await Promise.allSettled([
      projectApi.listNodes(projectId),
      projectApi.getNodesPairing(projectId),
      projectApi.listNodeInvites(projectId),
    ]);

    if (listRes.status === "fulfilled") {
      setNodes(listRes.value.nodes);
    } else {
      setNodes([]);
    }

    if (pairingRes.status === "fulfilled") {
      setPairing(pairingRes.value);
    } else {
      setPairing(null);
    }

    if (inviteRes.status === "fulfilled") {
      setInvites(inviteRes.value);
      setInviteError(null);
    } else {
      setInviteError(
        errorMessage(inviteRes.reason, "Không tải được danh sách mã pairing."),
      );
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [projectId, load]);

  useEffect(() => {
    if (!projectId) return;
    const timer = window.setInterval(() => {
      void load();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [projectId, load]);

  const nodeDevicePending = useMemo(
    () => (pairing?.devices.pending ?? []).filter(isNodeDeviceRequest),
    [pairing],
  );

  const nodePending = pairing?.nodes.pending ?? [];

  const runAction = async (key: string, fn: () => Promise<void>) => {
    setActionId(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleCreateInvite = () => {
    void runAction("create-invite", async () => {
      setInviteError(null);
      const created = await projectApi.createNodeInvite(projectId, { ttlMinutes: 15 });
      setLatestInviteCode(created.code);
      setInvites((prev) => [created.invite, ...prev.filter((row) => row.id !== created.invite.id)]);
    });
  };

  const handleCopyInvite = async () => {
    if (!latestInviteCode) return;
    try {
      await navigator.clipboard.writeText(latestInviteCode);
    } catch {
      setInviteError("Không copy được mã — hãy chọn và copy thủ công.");
    }
  };

  const handleRevokeInvite = (inviteId: string) => {
    void runAction(`revoke-invite-${inviteId}`, async () => {
      await projectApi.revokeNodeInvite(projectId, inviteId);
      setInvites((prev) => prev.filter((row) => row.id !== inviteId));
      if (latestInviteCode) {
        setLatestInviteCode(null);
      }
    });
  };
  const handleRename = (nodeId: string) => {
    const displayName = renameDrafts[nodeId]?.trim();
    if (!displayName) return;
    void runAction(`rename-${nodeId}`, () =>
      projectApi.renameNode(projectId, nodeId, { displayName }),
    );
  };

  if (!projectId) {
    return (
      <Typography variant="p" className={pageStyles.error}>
        Chưa có project. Tạo project tại mục Tổng quan trước.
      </Typography>
    );
  }

  if (loading && !pairing) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={3}
        className={pageStyles.loadingContainer}
      >
        <Spinner size="md" />
        <Typography variant="p" color="muted">
          Đang tải companion nodes…
        </Typography>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap={24} className={pageStyles.content}>
      {error ? (
        <Typography variant="p" className={pageStyles.error}>
          {error}
        </Typography>
      ) : null}

      <Card className={styles.setupCard}>
        <div className={pageStyles.cardInner}>
          <Typography variant="p" weight="medium">
            Kết nối thiết bị (Companion Node)
          </Typography>
          <Typography variant="small" color="muted">
            Cài app OpenClaw Node trên macOS hoặc Windows. Cách 1: nhập{" "}
            <strong>Gateway token</strong> từ Settings. Cách 2 (khuyên dùng): tạo{" "}
            <strong>mã pairing</strong> bên dưới, nhập mã trong app (hết hạn sau 15 phút, dùng
            một lần). Sau khi app connect, duyệt device + node tại đây.
          </Typography>
          {gatewayHttpBase ? (
            <Typography variant="small">
              Gateway URL:{" "}
              <code className={pageStyles.urlCode}>{gatewayHttpBase}</code>
            </Typography>
          ) : null}
          <Link href={`${DASHBOARD_BASE_PATH}/setting`}>
            <Button variant="secondary" size="sm">
              Mở Settings (Gateway token)
            </Button>
          </Link>

          <div className={styles.inviteBlock}>
            <Typography variant="p" weight="medium">
              Mã pairing (Phase 2)
            </Typography>
            <Typography variant="small" color="muted">
              Tạo mã ngắn hạn cho OpenClaw Node — không cần copy gateway token dài.
            </Typography>
            {inviteError ? (
              <Typography variant="small" className={pageStyles.error}>
                {inviteError}
              </Typography>
            ) : null}
            <div className={styles.inviteActions}>
              <Button
                size="sm"
                disabled={Boolean(actionId)}
                onClick={handleCreateInvite}
              >
                Tạo mã pairing
              </Button>
              {latestInviteCode ? (
                <>
                  <code className={pageStyles.urlCode}>{latestInviteCode}</code>
                  <Button variant="secondary" size="sm" onClick={() => void handleCopyInvite()}>
                    Copy
                  </Button>
                </>
              ) : null}
            </div>
            {invites.length > 0 ? (
              <div className={styles.inviteList}>
                {invites.slice(0, 5).map((invite) => (
                  <div key={invite.id} className={styles.inviteRow}>
                    <Typography variant="small">
                      <code className={pageStyles.urlCode}>{invite.codePrefix}…</code>
                      {" · "}
                      {invite.status}
                      {" · "}
                      hết hạn {new Date(invite.expiresAt).toLocaleString()}
                    </Typography>
                    {invite.status === "active" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={Boolean(actionId)}
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Thu hồi
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {(nodeDevicePending.length > 0 || nodePending.length > 0) && (
        <section className={pageStyles.section}>
          <div className={pageStyles.sectionHeader}>
            <div>
              <Typography variant="p" weight="medium">
                Yêu cầu pairing đang chờ
              </Typography>
              <Typography variant="small" color="muted">
                Companion node cần duyệt cả device (WS auth) và node (capabilities).
              </Typography>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={Boolean(actionId)}
              onClick={() => void load()}
            >
              Làm mới
            </Button>
          </div>

          {nodeDevicePending.map((req) => (
            <div key={req.requestId} className={pageStyles.pendingItem}>
              <Typography variant="p" weight="medium">
                Device · {req.displayName || req.deviceId}
              </Typography>
              <Typography variant="small" color="muted">
                {req.deviceId}
                {req.remoteIp ? ` · ${req.remoteIp}` : ""}
                {req.role ? ` · role: ${req.role}` : ""}
              </Typography>
              <div className={pageStyles.pendingActions}>
                <Button
                  size="sm"
                  disabled={Boolean(actionId)}
                  onClick={() =>
                    void runAction(`dev-approve-${req.requestId}`, () =>
                      projectApi.approveDevicePairing(projectId, req.requestId),
                    )
                  }
                >
                  Duyệt device
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(actionId)}
                  onClick={() => {
                    if (!window.confirm("Từ chối yêu cầu pairing device này?")) return;
                    void runAction(`dev-reject-${req.requestId}`, () =>
                      projectApi.rejectDevicePairing(projectId, req.requestId),
                    );
                  }}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          ))}

          {nodePending.map((req) => (
            <div key={req.requestId} className={pageStyles.pendingItem}>
              <Typography variant="p" weight="medium">
                Node · {req.displayName || req.nodeId}
              </Typography>
              <Typography variant="small" color="muted">
                {req.nodeId}
                {req.platform ? ` · ${req.platform}` : ""}
                {req.remoteIp ? ` · ${req.remoteIp}` : ""}
              </Typography>
              {req.commands && req.commands.length > 0 ? (
                <div className={pageStyles.chipRow}>
                  {req.commands.slice(0, 8).map((cmd) => (
                    <span key={cmd} className={pageStyles.chip}>
                      {cmd}
                    </span>
                  ))}
                </div>
              ) : null}
              {req.requiredApproveScopes && req.requiredApproveScopes.length > 0 ? (
                <Typography variant="small" color="muted">
                  Scopes cần duyệt: {req.requiredApproveScopes.join(", ")}
                </Typography>
              ) : null}
              <div className={pageStyles.pendingActions}>
                <Button
                  size="sm"
                  disabled={Boolean(actionId)}
                  onClick={() =>
                    void runAction(`node-approve-${req.requestId}`, () =>
                      projectApi.approveNodePairing(projectId, req.requestId),
                    )
                  }
                >
                  Duyệt node
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(actionId)}
                  onClick={() => {
                    if (!window.confirm("Từ chối yêu cầu pairing node này?")) return;
                    void runAction(`node-reject-${req.requestId}`, () =>
                      projectApi.rejectNodePairing(projectId, req.requestId),
                    );
                  }}
                >
                  Từ chối
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className={pageStyles.section}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <Typography variant="p" weight="medium">
              Nodes đã đăng ký
            </Typography>
            <Typography variant="small" color="muted">
              Trạng thái từ gateway (paired / connected).
            </Typography>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={Boolean(actionId)}
            onClick={() => void load()}
          >
            Làm mới
          </Button>
        </div>

        {nodes.length === 0 ? (
          <Typography variant="p" color="muted">
            Chưa kết nối với thiết bị companion nào.
          </Typography>
        ) : (
          nodes.map((node) => {
            const nodeId = String(node.nodeId ?? "");
            const title =
              (typeof node.displayName === "string" && node.displayName.trim()) ||
              nodeId ||
              "unknown";
            const connected = Boolean(node.connected);
            const paired = Boolean(node.paired);
            const caps = formatCaps(node.caps as unknown[] | undefined);
            const commands = formatCaps(node.commands as unknown[] | undefined);

            return (
              <div key={nodeId || title} className={pageStyles.nodeRow}>
                <div className={pageStyles.nodeRowHeader}>
                  <div>
                    <Typography variant="p" weight="medium">
                      {title}
                    </Typography>
                    <Typography variant="small" color="muted">
                      {nodeId}
                      {typeof node.platform === "string" ? ` · ${node.platform}` : ""}
                      {typeof node.remoteIp === "string" ? ` · ${node.remoteIp}` : ""}
                    </Typography>
                    <div className={pageStyles.chipRow}>
                      <span
                        className={`${pageStyles.chip} ${paired ? pageStyles.chipOk : pageStyles.chipWarn}`}
                      >
                        {paired ? "paired" : "unpaired"}
                      </span>
                      <span
                        className={`${pageStyles.chip} ${connected ? pageStyles.chipOk : pageStyles.chipWarn}`}
                      >
                        {connected ? "connected" : "offline"}
                      </span>
                      {caps.map((c) => (
                        <span key={`cap-${c}`} className={pageStyles.chip}>
                          {c}
                        </span>
                      ))}
                      {commands.map((c) => (
                        <span key={`cmd-${c}`} className={pageStyles.chip}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={Boolean(actionId) || !nodeId}
                    onClick={() => {
                      if (!window.confirm(`Gỡ node "${title}" khỏi gateway?`)) return;
                      void runAction(`remove-${nodeId}`, () =>
                        projectApi.removeNode(projectId, nodeId),
                      );
                    }}
                  >
                    Gỡ
                  </Button>
                </div>
                {nodeId ? (
                  <div className={pageStyles.renameRow}>
                    <Input
                      className={pageStyles.renameInput}
                      placeholder="Tên hiển thị"
                      value={renameDrafts[nodeId] ?? (typeof node.displayName === "string" ? node.displayName : "")}
                      onChange={(e) =>
                        setRenameDrafts((prev) => ({ ...prev, [nodeId]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={Boolean(actionId)}
                      onClick={() => handleRename(nodeId)}
                    >
                      Đổi tên
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </section>
    </Flex>
  );
}
