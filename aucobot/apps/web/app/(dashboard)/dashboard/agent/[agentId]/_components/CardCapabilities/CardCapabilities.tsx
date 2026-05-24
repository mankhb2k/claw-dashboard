"use client";

import React from "react";
import { Flex } from "@/components/layout";
import { Typography, Select, Switch, Input } from "@/components/ui";
import { Globe, FileText, Code, X } from "lucide-react";
import styles from "./CardCapabilities.module.css";

interface CardCapabilitiesProps {
  model: string;
  setModel: (val: string) => void;
  sandboxEnabled: boolean;
  setSandboxEnabled: (val: boolean) => void;
  askPolicy: "always" | "on-miss" | "off";
  setAskPolicy: (val: "always" | "on-miss" | "off") => void;
  safeBins: string[];
  newTagInput: string;
  setNewTagInput: (val: string) => void;
  timeoutSec: number;
  setTimeoutSec: (val: number) => void;
  handleAddTag: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveTag: (tag: string) => void;
}

export function CardCapabilities({
  model,
  setModel,
  sandboxEnabled,
  setSandboxEnabled,
  askPolicy,
  setAskPolicy,
  safeBins,
  newTagInput,
  setNewTagInput,
  timeoutSec,
  setTimeoutSec,
  handleAddTag,
  handleRemoveTag,
}: CardCapabilitiesProps) {
  return (
    <div className={styles.section}>
      <Typography variant="p" weight="bold">
        Cấu hình runtime (openclaw.json)
      </Typography>
      <Typography variant="small" color="muted">
        Model, sandbox và chính sách thực thi — không tạo file Markdown.
      </Typography>
      <Typography variant="p" weight="bold">
        AI Model
      </Typography>
      <Select
        options={[
          { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet (Khuyên dùng)" },
          { value: "gpt-4o", label: "GPT-4o" },
          { value: "gemini-1-5-pro", label: "Gemini 1.5 Pro" },
        ]}
        value={model}
        onValueChange={(val) => setModel(val)}
      />
      
      <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "16px 0" }} />
      
      <Typography variant="p" weight="bold" style={{ marginBottom: 8 }}>Công cụ hệ thống (Native Tools)</Typography>
      
      <div className={styles.toolItem}>
        <Flex align="center" gap={3}>
          <Globe size={20} color="var(--primary-color)" />
          <div>
            <Typography variant="p" weight="medium">Trình duyệt & Tìm kiếm Web</Typography>
            <Typography variant="small" color="muted">Cho phép Agent lướt web và lấy thông tin realtime.</Typography>
          </div>
        </Flex>
        <Switch checked={true} onCheckedChange={() => {}} />
      </div>

      <div className={styles.toolItem}>
        <Flex align="center" gap={3}>
          <FileText size={20} color="var(--primary-color)" />
          <div>
            <Typography variant="p" weight="medium">Đọc/Ghi File Workspace</Typography>
            <Typography variant="small" color="muted">Truy cập vào các file được upload trong dự án.</Typography>
          </div>
        </Flex>
        <Switch checked={true} onCheckedChange={() => {}} />
      </div>

      <div className={styles.toolItem}>
        <Flex align="center" gap={3}>
          <Code size={20} color="var(--primary-color)" />
          <div>
            <Typography variant="p" weight="medium">Thực thi Code (Sandbox)</Typography>
            <Typography variant="small" color="muted">Chạy Python/JS để tính toán và xử lý dữ liệu.</Typography>
          </div>
        </Flex>
        <Switch checked={sandboxEnabled} onCheckedChange={setSandboxEnabled} />
      </div>

      {/* Advanced Sandbox Customization Panel */}
      {sandboxEnabled && (
        <div className={styles.advancedPanel}>
          <Typography variant="small" weight="bold" color="primary" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            ⚙️ Cấu hình Sandbox nâng cao (ExecToolConfig)
          </Typography>

          {/* 1. Ask Policy (Segmented Control) */}
          <div className={styles.inputGroup}>
            <Typography variant="small" weight="medium">Chính sách phê duyệt (Ask Policy)</Typography>
            <div className={styles.segmentedControl}>
              {[
                { value: "always", label: "Luôn hỏi" },
                { value: "on-miss", label: "Tiêu chuẩn" },
                { value: "off", label: "Tự động" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.segmentedButton} ${askPolicy === opt.value ? styles.active : ""}`}
                  onClick={() => setAskPolicy(opt.value as any)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Typography variant="small" color="muted" style={{ marginTop: 4 }}>
              {askPolicy === "always" && "Agent luôn phải yêu cầu bạn phê duyệt trước khi thực thi bất kỳ lệnh nào."}
              {askPolicy === "on-miss" && "Chỉ yêu cầu phê duyệt cho các lệnh nằm ngoài danh sách được miễn hỏi bên dưới."}
              {askPolicy === "off" && "Agent được phép thực thi ngầm tự động mà không cần phê duyệt (Chỉ khuyên dùng khi chạy Docker Sandbox)."}
            </Typography>
          </div>

          {/* 3. Safe Binaries Tag Input */}
          <div className={styles.inputGroup}>
            <Typography variant="small" weight="medium">Các câu lệnh được miễn hỏi (Allowlist)</Typography>
            <div className={styles.tagContainer}>
              {safeBins.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    className={styles.tagDeleteBtn}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X size={13} style={{ marginLeft: 4 }} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder={safeBins.length === 0 ? "Nhập câu lệnh và nhấn Enter..." : "Thêm lệnh..."}
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
            <Typography variant="small" color="muted">
              Nhập tên câu lệnh và nhấn Enter hoặc dấu phẩy (,) để đưa vào danh sách trắng chạy ngầm.
            </Typography>
          </div>

          {/* 4. Timeout Limit */}
          <div className={styles.inputGroup}>
            <Typography variant="small" weight="medium">Thời gian chạy tối đa (Timeout)</Typography>
            <div className={styles.numberInputWrapper}>
              <Input
                type="number"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                min={5}
                max={3600}
              />
              <span className={styles.numberInputSuffix}>giây</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
