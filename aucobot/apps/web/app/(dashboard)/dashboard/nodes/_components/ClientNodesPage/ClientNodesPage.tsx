"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projectApi } from "@/lib/api/project";
import type {
  DevicePairingPending,
  NodeEntry,
  NodeInviteListItem,
  NodePairingPending,
  NodesPairingResponse,
} from "@/schemas/nodes.schema";
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
import {
  buildApprovalGroups,
  errorMessage,
  isNodeDeviceRequest,
} from "@/utils/nodes/nodes-utils";
import { CardCreateInvite } from "../CardCreateInvite/CardCreateInvite";
import { CardInviteHistory } from "../CardInviteHistory/CardInviteHistory";
import { CardGuide } from "../CardGuide/CardGuide";
import { CardDeviceManager } from "../CardDeviceManager/CardDeviceManager";
import { I18nTitleHeader } from "@/components/dashboard";
import styles from "./ClientNodesPage.module.css";

const POLL_MS = 4_000;
const POLL_BURST_MS = 2_000;
const POLL_BURST_DURATION_MS = 90_000;

type NodesConfirmAction =
  | { kind: "remove"; nodeId: string; title: string }
  | { kind: "reject-device"; req: DevicePairingPending }
  | { kind: "reject-node"; req: NodePairingPending };

function nodesConfirmCopy(action: NodesConfirmAction): {
  title: string;
  description: string;
  confirmLabel: string;
} {
  switch (action.kind) {
    case "remove":
      return {
        title: "Remove node from gateway?",
        description: `Are you sure you want to remove "${action.title}"? The device will disconnect from the gateway.`,
        confirmLabel: "Remove",
      };
    case "reject-device":
      return {
        title: "Reject device pairing?",
        description:
          "The device pairing request will be cancelled. The device must submit a new request to connect again.",
        confirmLabel: "Reject",
      };
    case "reject-node":
      return {
        title: "Reject node pairing?",
        description:
          "The node upgrade request will be cancelled. The node app must pair again after the device is approved.",
        confirmLabel: "Reject",
      };
  }
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
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [activeInviteExpiresAt, setActiveInviteExpiresAt] = useState<
    string | null
  >(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<NodesConfirmAction | null>(
    null,
  );
  const confirmActionRef = useRef<NodesConfirmAction | null>(null);

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
        errorMessage(inviteRes.reason, "Failed to load invite codes."),
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

  const nodePending = pairing?.nodes.pending ?? [];
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
        "New pairing request",
        "Approve device and node in the device manager card below.",
      );
      didNotifyPendingRef.current = true;
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount]);

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
      setError(err instanceof Error ? err.message : "Action failed");
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
    }
  };

  const actionBusy = Boolean(actionId);
  const confirmCopy = confirmAction ? nodesConfirmCopy(confirmAction) : null;

  const pageHeader = (
    <I18nTitleHeader
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
          No project yet. Create one on Overview first.
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
