import { useEffect, useState } from "preact/hooks";
import type { NodeConfig, NodePermissionPrefs } from "@shared/schemas/node-config.schema";
import { SmallToggle } from "../shared/SmallToggle";
import { DEFAULT_PERMISSIONS, PermissionToggles } from "./PermissionToggles";
import styles from "./SettingsSidebar.module.css";

type SettingsSidebarProps = {
  open: boolean;
  busy: boolean;
  config: NodeConfig | null;
  onClose: () => void;
  onSave: (patch: Partial<NodeConfig>) => Promise<{ ok: boolean; message?: string }>;
  onOpenNodes: () => void;
  onForgetPairing: () => void;
};

export function SettingsSidebar({
  open,
  busy,
  config,
  onClose,
  onSave,
  onOpenNodes,
  onForgetPairing,
}: SettingsSidebarProps) {
  const [displayName, setDisplayName] = useState("");
  const [openAtLogin, setOpenAtLogin] = useState(false);
  const [permissions, setPermissions] = useState<NodePermissionPrefs>(DEFAULT_PERMISSIONS);
  const [message, setMessage] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !config) return;
    setDisplayName(config.displayName ?? "");
    setOpenAtLogin(Boolean(config.openAtLogin));
    setPermissions({ ...DEFAULT_PERMISSIONS, ...config.permissions });
    setMessage(undefined);
  }, [open, config]);

  const handleSave = async () => {
    if (!config?.gatewayUrl) {
      setMessage("Chưa có cấu hình gateway. Kết nối bằng invite trước.");
      return;
    }

    const result = await onSave({
      gatewayUrl: config.gatewayUrl,
      aucobotWebUrl: config.aucobotWebUrl,
      displayName: displayName.trim() || undefined,
      openAtLogin,
      permissions,
    });

    setMessage(result.ok ? "Đã lưu cài đặt." : result.message ?? "Lưu thất bại.");
    if (result.ok) {
      onClose();
    }
  };

  return (
    <aside class={`${styles.sidebar} ${open ? styles.open : ""}`} aria-hidden={!open}>
      <div class={styles.scroll}>
        <div class={styles.header}>
          <h3 class={styles.headerTitle}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Cài đặt node
          </h3>
          <button type="button" class={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <section class={styles.section}>
          <label class={styles.sectionLabel}>Tên hiển thị</label>
          <input
            class={styles.input}
            type="text"
            value={displayName}
            placeholder="My workstation"
            onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
          />
        </section>

        <section class={styles.section}>
          <label class={styles.sectionLabel}>Dashboard đã lưu</label>
          <input
            class={`${styles.input} ${styles.inputReadonly}`}
            type="url"
            readOnly
            value={config?.aucobotWebUrl ?? ""}
          />
          {config?.aucobotWebUrl ? (
            <button type="button" class={styles.linkBtn} onClick={onOpenNodes}>
              Mở Companion Nodes →
            </button>
          ) : null}
        </section>

        <section class={styles.section}>
          <label class={styles.sectionLabel}>Quyền gateway có thể yêu cầu</label>
          <PermissionToggles value={permissions} onChange={setPermissions} />
        </section>

        <section class={styles.section}>
          <label class={styles.sectionLabel}>Tính năng</label>
          <div class={styles.row}>
            <div class={styles.rowText}>
              <h4>Launch at login</h4>
              <p>Khởi động minimized vào system tray</p>
            </div>
            <SmallToggle label="Launch at login" on={openAtLogin} onChange={setOpenAtLogin} />
          </div>
        </section>

        <section class={styles.section}>
          <button type="button" class={styles.dangerBtn} onClick={onForgetPairing}>
            Xóa pairing đã lưu
          </button>
        </section>

        {message ? (
          <p class={styles.sectionLabel} style={{ color: "#94a3b8", textTransform: "none", letterSpacing: 0 }}>
            {message}
          </p>
        ) : null}
      </div>

      <div class={styles.footer}>
        <button type="button" class={styles.saveBtn} disabled={busy} onClick={() => void handleSave()}>
          ÁP DỤNG & LƯU
        </button>
      </div>
    </aside>
  );
}
