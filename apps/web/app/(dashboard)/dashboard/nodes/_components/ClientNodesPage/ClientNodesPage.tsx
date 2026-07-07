"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./ClientNodesPage.module.css";
import { CardCreateInvite } from "../CardCreateInvite/CardCreateInvite";
import { CardDeviceManager } from "../CardDeviceManager/CardDeviceManager";
import { CardGuide } from "../CardGuide/CardGuide";
import { CardInviteHistory } from "../CardInviteHistory/CardInviteHistory";
import { TitleHeader } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Spinner,
  toast,
  Typography,
} from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";
import {
  buildApprovalGroups,
  errorMessage,
  isNodeDeviceRequest,
} from "@/utils/nodes/nodes-utils";

import type {
  DevicePairingPending,
  NodeEntry,
  NodeInviteListItem,
  NodePairingPending,
  NodesPairingResponse,
} from "@/schemas/nodes.schema";

const POLL_MS = 4_000;
const POLL_BURST_MS = 2_000;
const POLL_BURST_DURATION_MS = 90_000;

type NodesConfirmAction =
  | { kind: "remove"; nodeId: string; title: string }
  | { kind: "reject-device"; req: DevicePairingPending }
  | { kind: "reject-node"; req: NodePairingPending };

function nodesConfirmCopy(
  action: NodesConfirmAction,
  t: (path: string, vars?: Record<string, string>) => string,
): {
  title: string;
  description: string;
  confirmLabel: string;
} {
  switch (action.kind) {
    case "remove":
      return {
        title: t("nodes.confirm.removeTitle"),
        description: t("nodes.confirm.removeDescription", { title: action.title }),
        confirmLabel: t("nodes.confirm.removeLabel"),
      };
    case "reject-device":
      return {
        title: t("nodes.confirm.rejectDeviceTitle"),
        description: t("nodes.confirm.rejectDeviceDescription"),
        confirmLabel: t("nodes.confirm.rejectDeviceLabel"),
      };
    case "reject-node":
      return {
        title: t("nodes.confirm.rejectNodeTitle"),
        description: t("nodes.confirm.rejectNodeDescription"),
        confirmLabel: t("nodes.confirm.rejectNodeLabel"),
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

interface ClientNodesPageProps {
  projectId: string;
}

export function ClientNodesPage({ projectId }: ClientNodesPageProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeEntry[]>([]);
  const [pairing, setPairing] = useState<NodesPairingResponse | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [invites, setInvites] = useState<NodeInviteListItem[]>([]);
  const [latestInviteCode, setLatestInviteCode] = useState<string | null>(null);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [activeInviteExpiresAt, setActiveInviteExpiresAt] = useState<
    string | null
  >(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<NodesConfirmAction | null>(
    null,
  );
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);
  const [loading, setLoading] = useState(Boolean(projectId));
  const confirmActionRef = useRef<NodesConfirmAction | null>(null);

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setLoading(Boolean(projectId));
  }

  const prevPendingRef = useRef(0);
  const didNotifyPendingRef = useRef(false);

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
        errorMessage(inviteRes.reason, t("nodes.page.loadInvitesFailed")),
      );
    }
  }, [projectId, t]);

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      await Promise.resolve();
      await load().finally(() => setLoading(false));
    })();
  }, [projectId, load]);

  useEffect(() => {
    if (!projectId) return undefined;

    const burstUntil = Date.now() + POLL_BURST_DURATION_MS;
    let burstTimer: ReturnType<typeof setInterval> | null = null;
    const stopBurst = () => {
      if (burstTimer) {
        clearInterval(burstTimer);
        burstTimer = null;
      }
    };

    burstTimer = setInterval(() => {
      void load();
      if (Date.now() >= burstUntil) {
        stopBurst();
      }
    }, POLL_BURST_MS);

    const timer = window.setInterval(() => {
      void load();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      stopBurst();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [projectId, load]);

  const nodeDevicePending = useMemo(
    () => (pairing?.devices.pending ?? []).filter(isNodeDeviceRequest),
    [pairing],
  );

  const nodePending = useMemo(
    () => pairing?.nodes.pending ?? [],
    [pairing],
  );
  const pendingCount = nodeDevicePending.length + nodePending.length;
  const approvalGroups = useMemo(
    () => buildApprovalGroups(nodeDevicePending, nodePending),
    [nodeDevicePending, nodePending],
  );

  useEffect(() => {
    if (
      pendingCount > 0 &&
      prevPendingRef.current === 0 &&
      !didNotifyPendingRef.current
    ) {
      toast.success(
        t("nodes.toasts.newPairingTitle"),
        t("nodes.toasts.newPairingDescription"),
      );
      didNotifyPendingRef.current = true;
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, t]);

  const setConfirm = (action: NodesConfirmAction | null) => {
    confirmActionRef.current = action;
    setConfirmAction(action);
  };

  const runAction = async (key: string, fn: () => Promise<void>) => {
    setActionId(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("nodes.errors.actionFailed"));
    } finally {
      setActionId(null);
    }
  };

  const handleCreateInvite = () => {
    void runAction("create-invite", async () => {
      setInviteError(null);
      const created = await projectApi.createNodeInvite(projectId, {
        ttlMinutes: 15,
      });
      setLatestInviteCode(created.code);
      setActiveInviteId(created.invite.id);
      setActiveInviteExpiresAt(created.invite.expiresAt);
      setInvites((prev) => [
        created.invite,
        ...prev.filter((row) => row.id !== created.invite.id),
      ]);
    });
  };

  const handleRevokeInvite = (inviteId: string) => {
    void runAction(`revoke-invite-${inviteId}`, async () => {
      await projectApi.revokeNodeInvite(projectId, inviteId);
      setInvites((prev) => prev.filter((row) => row.id !== inviteId));
      if (inviteId === activeInviteId) {
        setLatestInviteCode(null);
        setActiveInviteId(null);
        setActiveInviteExpiresAt(null);
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

  const handleApproveDevice = (req: DevicePairingPending) => {
    void runAction(`dev-approve-${req.requestId}`, () =>
      projectApi.approveDevicePairing(projectId, req.requestId),
    );
  };

  const handleRejectDevice = (req: DevicePairingPending) => {
    setConfirm({ kind: "reject-device", req });
  };

  const handleApproveNode = (req: NodePairingPending) => {
    void runAction(`node-approve-${req.requestId}`, () =>
      projectApi.approveNodePairing(projectId, req.requestId),
    );
  };

  const handleRejectNode = (req: NodePairingPending) => {
    setConfirm({ kind: "reject-node", req });
  };

  const handleRemoveNode = (nodeId: string, title: string) => {
    setConfirm({ kind: "remove", nodeId, title });
  };

  const handleConfirmAction = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const action = confirmActionRef.current;
    if (!action) return;
    setConfirm(null);

    switch (action.kind) {
      case "remove":
        void runAction(`remove-${action.nodeId}`, () =>
          projectApi.removeNode(projectId, action.nodeId),
        );
        break;
      case "reject-device":
        void runAction(`dev-reject-${action.req.requestId}`, () =>
          projectApi.rejectDevicePairing(projectId, action.req.requestId),
        );
        break;
      case "reject-node":
        void runAction(`node-reject-${action.req.requestId}`, () =>
          projectApi.rejectNodePairing(projectId, action.req.requestId),
        );
        break;
      default: {
        const _exhaustive: never = action;
        throw new Error(
          `Unhandled nodes confirm action: ${String(_exhaustive)}`,
        );
      }
    }
  };

  const actionBusy = Boolean(actionId);
  const confirmCopy = confirmAction ? nodesConfirmCopy(confirmAction, t) : null;

  const pageHeader = (
    <TitleHeader
      titleKey="nodes.page.title"
      descriptionKey="nodes.page.description"
      showBorder
    />
  );

  if (!projectId) {
    return (
      <>
        {pageHeader}
        <Typography variant="p" className={styles.error}>
          {t("nodes.page.noProject")}
        </Typography>
      </>
    );
  }

  if (loading && !pairing) {
    return (
      <>
        {pageHeader}
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap={3}
          className={styles.loadingContainer}
        >
          <Spinner size="md" />
          <Typography variant="p" color="muted">
            Loading companion nodes...
          </Typography>
        </Flex>
      </>
    );
  }

  return (
    <Flex direction="column" gap={24} className={styles.content}>
      {pageHeader}
      {error ? (
        <Typography variant="p" className={styles.error}>
          {error}
        </Typography>
      ) : null}

      <CardCreateInvite
        latestInviteCode={latestInviteCode}
        activeInviteExpiresAt={activeInviteExpiresAt}
        inviteError={inviteError}
        actionBusy={actionBusy}
        onCreateInvite={handleCreateInvite}
        onCopyError={(message) => setInviteError(message || null)}
      />
      <CardInviteHistory
        invites={invites}
        actionBusy={actionBusy}
        onRevokeInvite={handleRevokeInvite}
      />
      <CardDeviceManager
        groups={approvalGroups}
        pendingCount={pendingCount}
        hasDevicePending={nodeDevicePending.length > 0}
        hasNodePending={nodePending.length > 0}
        nodes={nodes}
        renameDrafts={renameDrafts}
        actionBusy={actionBusy}
        onRefresh={() => void load()}
        onApproveDevice={handleApproveDevice}
        onRejectDevice={handleRejectDevice}
        onApproveNode={handleApproveNode}
        onRejectNode={handleRejectNode}
        onRenameChange={(nodeId, value) =>
          setRenameDrafts((prev) => ({ ...prev, [nodeId]: value }))
        }
        onRename={handleRename}
        onRemove={handleRemoveNode}
      />
      <CardGuide />

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              disabled={actionBusy}
              onClick={(e) => handleConfirmAction(e)}
            >
              {confirmCopy?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Flex>
  );
}
