"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import styles from "./CardInviteHistory.module.css";
import pageStyles from "../../nodes.module.css";
import { Button, Typography } from "@/components/ui";
import { inviteStatusLabel } from "@/utils/nodes/nodes-utils";

import type { NodeInviteListItem } from "@/schemas/nodes.schema";

export type CardInviteHistoryProps = {
  invites: NodeInviteListItem[];
  actionBusy: boolean;
  onRevokeInvite: (inviteId: string) => void;
};

export function CardInviteHistory({
  invites,
  actionBusy,
  onRevokeInvite,
}: CardInviteHistoryProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  if (invites.length === 0) return null;

  const historyInvites = invites
    .filter((row) => row.status !== "active")
    .slice(0, 8);

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setHistoryOpen((v) => !v)}
        aria-expanded={historyOpen}
      >
        <Typography variant="small" weight="medium">
          Created invite codes ({invites.length})
        </Typography>
        <ChevronDown
          size={18}
          className={historyOpen ? styles.chevronOpen : styles.chevron}
        />
      </button>
      {historyOpen ? (
        <ul className={styles.list}>
          {invites.slice(0, 5).map((invite) => (
            <li key={invite.id} className={styles.row}>
              <div>
                <code className={pageStyles.urlCode}>
                  {invite.codePrefix}…
                </code>
                <Typography variant="small" color="muted">
                  {inviteStatusLabel(invite.status)} ·{" "}
                  {new Date(invite.expiresAt).toLocaleString()}
                </Typography>
              </div>
              {invite.status === "active" ||
              invite.status === "used" ||
              invite.status === "expired" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionBusy}
                  onClick={() => onRevokeInvite(invite.id)}
                >
                  {invite.status === "active" ? "Revoke" : "Delete"}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {!historyOpen && historyInvites.length > 0 ? (
        <Typography variant="small" color="muted" className={styles.hint}>
          {historyInvites.length} previous code(s) (expand to view)
        </Typography>
      ) : null}
    </div>
  );
}
