"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, Card, Typography } from "@/components/ui";
import { formatCountdownMs } from "../ClientNodesPage/nodes-utils";
import pageStyles from "../../nodes.module.css";
import styles from "./CardCreateInvite.module.css";

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
  const [countdown, setCountdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [latestInviteCode]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!activeInviteExpiresAt) {
      setCountdown(null);
      return;
    }
    const tick = () => setCountdown(formatCountdownMs(activeInviteExpiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [activeInviteExpiresAt]);

  const handleCopy = async () => {
    if (!latestInviteCode) return;
    try {
      await navigator.clipboard.writeText(latestInviteCode);
      setCopied(true);
      onCopyError("");
    } catch {
      onCopyError("Không copy được mã — hãy chọn và copy thủ công.");
    }
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.inner}>
          <Typography variant="p" weight="medium">
            Mã invite
          </Typography>
          <Typography variant="small" color="muted">
            Tạo mã ngắn hạn cho OpenClaw Node — hết hạn sau 15 phút, dùng một
            lần.
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
                  size="icon"
                  className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
                  aria-label={copied ? "Đã sao chép" : "Sao chép mã invite"}
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
                <span className={styles.codeMeta}>⏱ Còn {countdown}</span>
              ) : null}
            </div>
          ) : (
            <div className={styles.codePlaceholder}>
              <Typography variant="small" color="muted">
                Chưa có mã — nhấn tạo mã invite để bắt đầu
              </Typography>
            </div>
          )}

          <div className={styles.actions}>
            <Button size="sm" disabled={actionBusy} onClick={onCreateInvite}>
              {latestInviteCode ? "Tạo mã mới" : "Tạo mã invite"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
