import { useState } from "preact/hooks";
import styles from "./InviteModal.module.css";

type InviteModalProps = {
  open: boolean;
  busy: boolean;
  initialWebUrl?: string;
  error?: string;
  onClose: () => void;
  onSubmit: (payload: { webBaseUrl: string; inviteCode: string }) => void;
};

export function InviteModal({
  open,
  busy,
  initialWebUrl,
  error,
  onClose,
  onSubmit,
}: InviteModalProps) {
  const [webBaseUrl, setWebBaseUrl] = useState(initialWebUrl || "http://localhost:3000");
  const [inviteCode, setInviteCode] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div class={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div class={styles.card}>
        <h2 id="invite-title" class={styles.title}>
          Kết nối bằng mã pairing
        </h2>
        <p class={styles.subtitle}>
          Chỉ nhập URL dashboard (frontend). App gọi <code>/api/nodes/invites/redeem</code> qua Next.js —
          không lưu hay hiển thị URL API backend.
        </p>

        <div class={styles.field}>
          <label class={styles.label} for="web-url">
            URL Dashboard AucoBot
          </label>
          <input
            id="web-url"
            class={styles.input}
            type="url"
            placeholder="https://app.example.com"
            value={webBaseUrl}
            onInput={(e) => setWebBaseUrl((e.target as HTMLInputElement).value)}
          />
        </div>

        <div class={styles.field}>
          <label class={styles.label} for="invite-code">
            Mã pairing (nd-inv-…)
          </label>
          <input
            id="invite-code"
            class={styles.input}
            type="text"
            placeholder="nd-inv-XXXXXXXX"
            value={inviteCode}
            onInput={(e) => setInviteCode((e.target as HTMLInputElement).value)}
          />
        </div>

        {error ? <p class={styles.error}>{error}</p> : null}

        <div class={styles.actions}>
          <button type="button" class={styles.btnSecondary} disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            class={styles.btnPrimary}
            disabled={busy || !webBaseUrl.trim() || !inviteCode.trim()}
            onClick={() =>
              onSubmit({
                webBaseUrl: webBaseUrl.trim(),
                inviteCode: inviteCode.trim(),
              })
            }
          >
            {busy ? "Đang kết nối…" : "Kết nối"}
          </button>
        </div>
      </div>
    </div>
  );
}
