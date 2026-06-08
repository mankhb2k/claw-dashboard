"use client";

import { useEffect, useState } from "react";
import { Button, Select, Switch, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { AlertTriangle } from "lucide-react";
import { projectApi } from "@/lib/api/project";
import styles from "./SettingSandboxSection.module.css";
import { CardSection } from "../CardSection/CardSection";
import { TitleSection } from "../TitleSection/TitleSection";

interface Props {
  projectId: string;
}

type SandboxMode = "non-main" | "all";

const MODE_OPTIONS = [
  { value: "non-main", label: "Chỉ sub-agent (non-main)" },
  { value: "all", label: "Toàn bộ agent (cô lập tối đa)" },
];

export function SettingSandboxSection({ projectId }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<SandboxMode>("non-main");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    let active = true;
    if (!projectId) return;
    projectApi
      .getProjectSandbox(projectId)
      .then((res) => {
        if (!active) return;
        setEnabled(res.enabled);
        setMode(res.mode);
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleToggle = (val: boolean) => {
    setEnabled(val);
    setDirty(true);
  };

  const handleMode = (val: SandboxMode) => {
    setMode(val);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await projectApi.updateProjectSandbox(projectId, { enabled, mode });
      setSaveStatus("saved");
      setDirty(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection title="Sandbox" />

      <CardSection>
        <CardSection.Row className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Bật sandbox cho toàn bộ agent
            </Typography>
            <Typography variant="small" color="muted">
              Khi bật, sandbox áp dụng cho mọi agent của dự án (trừ agent đã cấu
              hình riêng). Tăng cô lập nhưng cần Docker khả dụng trong runtime.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={!loaded}
              aria-label="Bật sandbox toàn cục"
            />
          </CardSection.Action>
        </CardSection.Row>

        <CardSection.Row noBorder className={styles.cardRow}>
          <CardSection.Info className={styles.rowInfo}>
            <Typography variant="p" weight="medium">
              Mức cô lập mặc định
            </Typography>
            <Typography variant="small" color="muted">
              Áp dụng cho mọi agent dùng cấu hình mặc định của dự án.
            </Typography>
          </CardSection.Info>
          <CardSection.Action className={styles.rowAction}>
            <Select
              id="sandbox-default-mode"
              options={MODE_OPTIONS}
              value={mode}
              onValueChange={(val) => handleMode(val as SandboxMode)}
              disabled={!loaded || !enabled}
            />
          </CardSection.Action>
        </CardSection.Row>

        <div className={styles.callout}>
          <AlertTriangle size={16} aria-hidden />
          <Typography variant="small" color="muted">
            Backend <code>docker</code> yêu cầu gateway truy cập được Docker
            (socket hoặc DinD). Trên cloud mô hình &quot;1 project = 1
            container&quot;, nếu runtime chưa hỗ trợ Docker thì hãy để tắt.
          </Typography>
        </div>

        <CardSection.Footer>
          {saveStatus === "error" && (
            <p className={styles.fieldError}>Có lỗi xảy ra, vui lòng thử lại.</p>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!dirty || saveStatus === "saving"}
            size="sm"
          >
            {saveStatus === "saving"
              ? "Đang lưu..."
              : saveStatus === "saved"
                ? "✓ Đã lưu"
                : "Lưu thay đổi"}
          </Button>
        </CardSection.Footer>
      </CardSection>
    </Flex>
  );
}
