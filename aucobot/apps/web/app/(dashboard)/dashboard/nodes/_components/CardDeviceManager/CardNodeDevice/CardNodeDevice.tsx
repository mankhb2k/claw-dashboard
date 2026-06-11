"use client";

import { Laptop, Monitor } from "lucide-react";
import type { NodeEntry } from "@/schemas/nodes.schema";
import { Button, Input, Typography } from "@/components/ui";
import { formatCaps, getNodeTitle } from "@/utils/nodes/nodes-utils";
import pageStyles from "../../../nodes.module.css";
import styles from "./CardNodeDevice.module.css";

type CardNodeDeviceProps = {
  node: NodeEntry;
  renameValue: string;
  actionBusy: boolean;
  onRenameChange: (value: string) => void;
  onRename: () => void;
  onRemove: () => void;
};

function platformIcon(platform?: string) {
  const p = platform?.toLowerCase() ?? "";
  if (p.includes("win")) return Monitor;
  return Laptop;
}

export function CardNodeDevice({
  node,
  renameValue,
  actionBusy,
  onRenameChange,
  onRename,
  onRemove,
}: CardNodeDeviceProps) {
  const nodeId = String(node.nodeId ?? "");
  const title = getNodeTitle(node);
  const connected = Boolean(node.connected);
  const paired = Boolean(node.paired);
  const pairingComplete = paired && connected;
  const pairingPending = paired && !connected;
  const caps = formatCaps(node.caps as unknown[] | undefined);
  const commands = formatCaps(node.commands as unknown[] | undefined);
  const chips = [...caps, ...commands].slice(0, 6);
  const overflow = caps.length + commands.length - chips.length;
  const Icon = platformIcon(typeof node.platform === "string" ? node.platform : undefined);

  return (
    <article className={styles.card}>
      <div className={styles.cardMain}>
        <div className={styles.iconWrap}>
          <Icon size={22} className={styles.icon} />
        </div>
        <div className={styles.info}>
          <div className={styles.titleRow}>
            <Typography variant="p" weight="medium">
              {title}
            </Typography>
            <span
              className={styles.statusDot}
              data-online={connected}
              title={connected ? "Online" : "Offline"}
            />
          </div>
          <Typography variant="small" color="muted">
            {nodeId}
            {typeof node.platform === "string" ? ` · ${node.platform}` : ""}
            {typeof node.remoteIp === "string" ? ` · ${node.remoteIp}` : ""}
          </Typography>
          <div className={pageStyles.chipRow}>
            <span
              className={`${pageStyles.chip} ${pairingComplete ? pageStyles.chipOk : pageStyles.chipWarn}`}
            >
              {pairingComplete
                ? "Paired"
                : pairingPending
                  ? "Node pending"
                  : "Not paired"}
            </span>
            <span
              className={`${pageStyles.chip} ${connected ? pageStyles.chipOk : pageStyles.chipWarn}`}
            >
              {connected ? "Online" : "Offline"}
            </span>
            {chips.map((c) => (
              <span key={c} className={pageStyles.chip}>
                {c}
              </span>
            ))}
            {overflow > 0 ? (
              <span className={pageStyles.chip}>+{overflow}</span>
            ) : null}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={actionBusy || !nodeId}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
      {nodeId ? (
        <div className={pageStyles.renameRow}>
          <Input
            className={pageStyles.renameInput}
            placeholder="Display name"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={actionBusy}
            onClick={onRename}
          >
            Rename
          </Button>
        </div>
      ) : null}
    </article>
  );
}
