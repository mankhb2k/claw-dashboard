"use client";

import type { ApprovalGroup } from "@/utils/nodes/nodes-utils";
import type {
  DevicePairingPending,
  NodePairingPending,
} from "@/schemas/nodes.schema";
import { Button, Typography } from "@/components/ui";
import pageStyles from "../../nodes.module.css";
import styles from "./PendingApprovalCard.module.css";

type PendingApprovalCardProps = {
  group: ApprovalGroup;
  actionBusy: boolean;
  onApproveDevice: (req: DevicePairingPending) => void;
  onRejectDevice: (req: DevicePairingPending) => void;
  onApproveNode: (req: NodePairingPending) => void;
  onRejectNode: (req: NodePairingPending) => void;
};

export function PendingApprovalCard({
  group,
  actionBusy,
  onApproveDevice,
  onRejectDevice,
  onApproveNode,
  onRejectNode,
}: PendingApprovalCardProps) {
  const { device, node, title, subtitle } = group;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <Typography variant="p" weight="medium">
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="small" color="muted">
            {subtitle}
          </Typography>
        ) : null}
      </header>

      {device ? (
        <div className={styles.step}>
          <div className={styles.stepLabel}>
            <span className={styles.stepDot} data-done={false} />
            <Typography variant="small" weight="medium">
              Bước 1 · Device (WS auth)
            </Typography>
          </div>
          <Typography variant="small" color="muted" className={styles.stepMeta}>
            {device.deviceId}
            {device.remoteIp ? ` · ${device.remoteIp}` : ""}
            {device.role ? ` · role: ${device.role}` : ""}
          </Typography>
          <div className={pageStyles.pendingActions}>
            <Button
              size="sm"
              disabled={actionBusy}
              onClick={() => onApproveDevice(device)}
            >
              Duyệt device
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={actionBusy}
              onClick={() => onRejectDevice(device)}
            >
              Từ chối
            </Button>
          </div>
        </div>
      ) : null}

      {node ? (
        <div className={styles.step}>
          <div className={styles.stepLabel}>
            <span
              className={styles.stepDot}
              data-done={Boolean(device)}
              data-waiting={!device}
            />
            <Typography variant="small" weight="medium">
              Bước 2 · Node (capabilities)
            </Typography>
          </div>
          <Typography variant="small" color="muted" className={styles.stepMeta}>
            {node.nodeId}
            {node.platform ? ` · ${node.platform}` : ""}
            {node.remoteIp ? ` · ${node.remoteIp}` : ""}
          </Typography>
          {node.commands && node.commands.length > 0 ? (
            <div className={pageStyles.chipRow}>
              {node.commands.slice(0, 8).map((cmd) => (
                <span key={cmd} className={pageStyles.chip}>
                  {cmd}
                </span>
              ))}
            </div>
          ) : null}
          {node.requiredApproveScopes && node.requiredApproveScopes.length > 0 ? (
            <Typography variant="small" color="muted">
              Scopes: {node.requiredApproveScopes.join(", ")}
            </Typography>
          ) : null}
          <div className={pageStyles.pendingActions}>
            <Button
              size="sm"
              disabled={actionBusy}
              onClick={() => onApproveNode(node)}
            >
              Duyệt node
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={actionBusy}
              onClick={() => onRejectNode(node)}
            >
              Từ chối
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
