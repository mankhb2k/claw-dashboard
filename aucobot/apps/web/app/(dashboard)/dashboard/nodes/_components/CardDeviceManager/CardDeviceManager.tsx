"use client";

import { Laptop, RotateCw } from "lucide-react";
import type {
  DevicePairingPending,
  NodeEntry,
  NodePairingPending,
} from "@/schemas/nodes.schema";
import { Button, Card, Typography } from "@/components/ui";
import type { ApprovalGroup } from "../ClientNodesPage/nodes-utils";
import { PendingApprovalCard } from "./PendingApprovalCard";
import { NodeDeviceCard } from "./NodeDeviceCard";
import pageStyles from "../../nodes.module.css";
import styles from "./CardDeviceManager.module.css";

export type CardDeviceManagerProps = {
  groups: ApprovalGroup[];
  pendingCount: number;
  hasDevicePending: boolean;
  hasNodePending: boolean;
  nodes: NodeEntry[];
  renameDrafts: Record<string, string>;
  actionBusy: boolean;
  onRefresh: () => void;
  onApproveDevice: (req: DevicePairingPending) => void;
  onRejectDevice: (req: DevicePairingPending) => void;
  onApproveNode: (req: NodePairingPending) => void;
  onRejectNode: (req: NodePairingPending) => void;
  onRenameChange: (nodeId: string, value: string) => void;
  onRename: (nodeId: string) => void;
  onRemove: (nodeId: string, title: string) => void;
};

export function CardDeviceManager({
  groups,
  pendingCount,
  hasDevicePending,
  hasNodePending,
  nodes,
  renameDrafts,
  actionBusy,
  onRefresh,
  onApproveDevice,
  onRejectDevice,
  onApproveNode,
  onRejectNode,
  onRenameChange,
  onRename,
  onRemove,
}: CardDeviceManagerProps) {
  const stepDeviceDone = !hasDevicePending && hasNodePending;
  const stepNodeDone = pendingCount === 0;
  const showApproval = pendingCount > 0;

  return (
    <Card className={styles.card}>
      <div className={styles.cardInner}>
        <div className={pageStyles.sectionHeader}>
          <div>
            <Typography variant="p" weight="medium">
              Thiết bị companion
            </Typography>
            <Typography variant="small" color="muted">
              {showApproval
                ? "Có thiết bị chờ ghép nối — duyệt yêu cầu và quản lý thiết bị đã kết nối."
                : "Quản lý thiết bị companion đã kết nối với gateway."}
            </Typography>
          </div>
          <Button variant="secondary" size="sm" disabled={actionBusy} onClick={onRefresh}>
            <RotateCw size={16} aria-hidden />
            Làm mới
          </Button>
        </div>

        {showApproval ? (
          <>
            <section className={styles.section} aria-labelledby="nodes-approval-heading">
              <div className={styles.sectionTitleRow}>
                <Typography variant="p" weight="medium" id="nodes-approval-heading">
                  Yêu cầu duyệt
                </Typography>
                <span className={styles.badge}>{pendingCount}</span>
              </div>

              <div className={styles.stepper}>
                <div className={styles.stepperTrack}>
                  <span
                    className={styles.stepperDot}
                    data-state={
                      hasDevicePending
                        ? "active"
                        : stepDeviceDone || stepNodeDone
                          ? "done"
                          : "idle"
                    }
                  />
                  <span className={styles.stepperLine} />
                  <span
                    className={styles.stepperDot}
                    data-state={
                      hasNodePending
                        ? "active"
                        : stepNodeDone
                          ? "done"
                          : hasDevicePending
                            ? "idle"
                            : "done"
                    }
                  />
                  <span className={styles.stepperLine} />
                  <span
                    className={styles.stepperDot}
                    data-state={stepNodeDone ? "done" : "idle"}
                  />
                </div>
                <div className={styles.stepperLabels}>
                  <span>Device</span>
                  <span>Node</span>
                  <span>Xong</span>
                </div>
              </div>

              <div className={styles.alertBanner}>
                <Typography variant="small" weight="medium">
                  {pendingCount} yêu cầu đang chờ — duyệt device (WS) rồi node (capabilities).
                </Typography>
              </div>

              <div className={styles.groupList}>
                {groups.map((group) => (
                  <PendingApprovalCard
                    key={group.id}
                    group={group}
                    actionBusy={actionBusy}
                    onApproveDevice={onApproveDevice}
                    onRejectDevice={onRejectDevice}
                    onApproveNode={onApproveNode}
                    onRejectNode={onRejectNode}
                  />
                ))}
              </div>
            </section>

            <div className={styles.divider} role="separator" />
          </>
        ) : null}

        <section className={styles.section} aria-labelledby="nodes-fleet-heading">
          <Typography variant="p" weight="medium" id="nodes-fleet-heading">
            Thiết bị đã kết nối · {nodes.length}
          </Typography>
          <Typography variant="small" color="muted" className={styles.sectionHint}>
            Trạng thái từ gateway (paired / connected).
          </Typography>

          {nodes.length === 0 ? (
            <div className={styles.inlineEmpty}>
              <Laptop size={20} className={styles.inlineEmptyIcon} />
              <Typography variant="small" color="muted">
                Chưa có thiết bị companion. Tạo mã invite phía trên, kết nối app rồi duyệt
                yêu cầu.
              </Typography>
            </div>
          ) : (
            <div className={styles.deviceList}>
              {nodes.map((node) => {
                const nodeId = String(node.nodeId ?? "");
                const title =
                  (typeof node.displayName === "string" && node.displayName.trim()) ||
                  nodeId ||
                  "unknown";

                return (
                  <NodeDeviceCard
                    key={nodeId || title}
                    node={node}
                    renameValue={
                      renameDrafts[nodeId] ??
                      (typeof node.displayName === "string" ? node.displayName : "")
                    }
                    actionBusy={actionBusy}
                    onRenameChange={(value) => onRenameChange(nodeId, value)}
                    onRename={() => onRename(nodeId)}
                    onRemove={() => onRemove(nodeId, title)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}
