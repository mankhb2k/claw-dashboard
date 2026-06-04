import type { NodePermissionPrefs } from "@shared/schemas/node-config.schema";
import { SmallToggle } from "../shared/SmallToggle";
import styles from "./PermissionToggles.module.css";

export const DEFAULT_PERMISSIONS: NodePermissionPrefs = {
  systemRun: true,
  systemWhich: true,
  execApprovals: true,
};

type PermissionTogglesProps = {
  value: NodePermissionPrefs;
  onChange: (next: NodePermissionPrefs) => void;
};

const ITEMS: Array<{
  key: keyof NodePermissionPrefs;
  title: string;
  desc: string;
}> = [
  {
    key: "systemRun",
    title: "system.run",
    desc: "Cho phép agent chạy lệnh shell trên máy này (có exec approvals local).",
  },
  {
    key: "systemWhich",
    title: "system.which",
    desc: "Tra cứu đường dẫn binary trước khi chạy lệnh.",
  },
  {
    key: "execApprovals",
    title: "exec approvals",
    desc: "Quản lý allowlist / hỏi trước khi thực thi (~/.openclaw/exec-approvals.json).",
  },
];

export function PermissionToggles({ value, onChange }: PermissionTogglesProps) {
  return (
    <div>
      <div class={styles.list}>
        {ITEMS.map((item) => (
          <div class={styles.row} key={item.key}>
            <div>
              <h4 class={styles.title}>{item.title}</h4>
              <p class={styles.desc}>{item.desc}</p>
            </div>
            <SmallToggle
              label={item.title}
              on={Boolean(value[item.key])}
              onChange={(next) => onChange({ ...value, [item.key]: next })}
            />
          </div>
        ))}
      </div>
      <p class={styles.note}>
        Gateway vẫn phải duyệt pairing trên Companion Nodes. Các quyền trên mô tả khả năng node host
        khai báo với OpenClaw — áp dụng sau lần kết nối tiếp theo.
      </p>
    </div>
  );
}
