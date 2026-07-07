"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./CardCreateInvite.module.css";
import pageStyles from "../../nodes.module.css";
import { Button, Card, Typography } from "@/components/ui";
import { formatCountdownMs } from "@/utils/nodes/nodes-utils";

export type CardCreateInviteProps = {
  latestInviteCode: string | null;
  activeInviteExpiresAt: string | null;
  inviteError: string | null;
  actionBusy: boolean;
  onCreateInvite: () => void;
  onCopyError: (message: string) => void;
};

export function CardCreateInvite({
  latestInviteCode,
  activeInviteExpiresAt,
  inviteError,
  actionBusy,
  onCreateInvite,
  onCopyError,
}: CardCreateInviteProps) {
  const [copiedForCode, setCopiedForCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string | null>(() =>
    activeInviteExpiresAt ? formatCountdownMs(activeInviteExpiresAt) : null,
  );
  const [trackedExpiresAt, setTrackedExpiresAt] = useState(activeInviteExpiresAt);

  const copied = Boolean(
    latestInviteCode && copiedForCode === latestInviteCode,
  );

  if (activeInviteExpiresAt !== trackedExpiresAt) {
    setTrackedExpiresAt(activeInviteExpiresAt);
    setCountdown(
      activeInviteExpiresAt ? formatCountdownMs(activeInviteExpiresAt) : null,
    );
  }

  useEffect(() => {
    if (!activeInviteExpiresAt) return undefined;
    const timer = window.setInterval(() => {
      setCountdown(formatCountdownMs(activeInviteExpiresAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeInviteExpiresAt]);

  const handleCopy = async () => {
    if (!latestInviteCode) return;
    try {
      await navigator.clipboard.writeText(latestInviteCode);
      setCopiedForCode(latestInviteCode);
      onCopyError("");
    } catch {
      onCopyError("Could not copy — select and copy the code manually.");
    }
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.inner}>
          <Typography variant="p" weight="medium">
            Invite code
          </Typography>
          <Typography variant="small" color="muted">
            Create a short-lived code for OpenClaw Node — expires in 15 minutes, single use.
          </Typography>

          {inviteError ? (
            <Typography variant="small" className={pageStyles.error}>
              {inviteError}
            </Typography>
          ) : null}

          {latestInviteCode ? (
            <div className={styles.codeBox}>
              <div className={styles.codeRow}>
                <code className={styles.codeText}>{latestInviteCode}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  iconOnly
                  className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
                  aria-label={copied ? "Copied" : "Copy invite code"}
                  onClick={() => void handleCopy()}
                >
                  {copied ? (
                    <Check size={18} aria-hidden />
                  ) : (
                    <Copy size={18} aria-hidden />
                  )}
                </Button>
              </div>
              {countdown ? (
                <span className={styles.codeMeta}>
                  {countdown === "Expired" ? countdown : `Time left ${countdown}`}
                </span>
              ) : null}
            </div>
          ) : (
            <div className={styles.codePlaceholder}>
              <Typography variant="small" color="muted">
                No code yet — click create invite to get started
              </Typography>
            </div>
          )}

          <div className={styles.actions}>
            <Button size="sm" disabled={actionBusy} onClick={onCreateInvite}>
              {latestInviteCode ? "Create new code" : "Create invite code"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
