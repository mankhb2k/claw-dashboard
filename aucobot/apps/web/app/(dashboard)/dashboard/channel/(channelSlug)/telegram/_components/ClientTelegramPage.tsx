"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flex } from "@/components/layout";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { Select } from "@/components/ui/Select/Select";
import { projectApi } from "@/lib/api/project";
import type { ProjectChannel } from "@/schemas/project.schema";
import {
  readTelegramAccessFromConfig,
  TELEGRAM_DM_POLICY_OPTIONS,
  validateTelegramAccessForm,
  type TelegramDmPolicy,
} from "@/lib/telegram-access";
import styles from "../telegram.module.css";

interface Props {
  projectId: string;
}

function preserveBotUsername(
  config: unknown,
  patch: { dmPolicy: TelegramDmPolicy; allowFrom: string[] },
): Record<string, unknown> {
  const base =
    config && typeof config === "object" && config !== null
      ? { ...(config as Record<string, unknown>) }
      : {};
  return {
    ...base,
    dmPolicy: patch.dmPolicy,
    allowFrom: patch.allowFrom,
  };
}

export function ClientTelegramPage({ projectId }: Props) {
  const [token, setToken] = useState("");
  const [dmPolicy, setDmPolicy] = useState<TelegramDmPolicy>("allowlist");
  const [allowFromInput, setAllowFromInput] = useState("");
  const [channel, setChannel] = useState<ProjectChannel | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    projectApi
      .listChannels(projectId)
      .then((rows) => {
        const row = rows.find((c) => c.channelId === "telegram") ?? null;
        setChannel(row);
        if (row) {
          const access = readTelegramAccessFromConfig(row.config);
          setDmPolicy(access.dmPolicy);
          setAllowFromInput(access.allowFromInput);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không tải được cấu hình kênh");
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const accessValidation = useMemo(
    () => validateTelegramAccessForm({ dmPolicy, allowFromInput }),
    [dmPolicy, allowFromInput],
  );

  const savedAccess = useMemo(
    () => (channel ? readTelegramAccessFromConfig(channel.config) : null),
    [channel],
  );

  const hasBotToken = Boolean(channel?.secrets.some((s) => s.key === "bot_token"));
  const policyOption = TELEGRAM_DM_POLICY_OPTIONS.find((o) => o.value === dmPolicy);

  const handleSave = async () => {
    if (!projectId) return;

    if (!accessValidation.ok) {
      setFieldError(accessValidation.message);
      return;
    }

    const needsNewToken = !hasBotToken;
    if (needsNewToken && !token.trim()) {
      setFieldError("Cần nhập bot token để kết nối lần đầu.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setFieldError(null);

    try {
      let row = channel ?? (await projectApi.getOrCreateChannel(projectId, "telegram"));
      const configPatch = preserveBotUsername(row.config, {
        dmPolicy: accessValidation.dmPolicy,
        allowFrom: accessValidation.allowFrom,
      });

      row = await projectApi.updateChannel(projectId, row.id, { config: configPatch });

      if (token.trim()) {
        await projectApi.upsertChannelSecret(projectId, row.id, "bot_token", token.trim());
        const test = await projectApi.testChannel(projectId, row.id);
        if (!test.ok) {
          throw new Error(test.message ?? "Kiểm tra token thất bại");
        }
        row = await projectApi.updateChannel(projectId, row.id, {
          config: configPatch,
          enabled: true,
        });
        setToken("");
        setSuccess(test.message ?? "Đã lưu và kích hoạt kênh Telegram");
      } else if (row.connectionStatus === "connected") {
        row = await projectApi.updateChannel(projectId, row.id, {
          config: configPatch,
          enabled: true,
        });
        setSuccess("Đã cập nhật chính sách truy cập DM");
      } else {
        setSuccess("Đã lưu cấu hình — nhập token và lưu lại để kích hoạt");
      }

      setChannel(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!projectId || !channel) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await projectApi.updateChannel(projectId, channel.id, { enabled: false });
      setChannel(updated);
      setSuccess("Đã tắt kênh Telegram");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tắt kênh thất bại");
    } finally {
      setSaving(false);
    }
  };

  const botUsername =
    channel?.config &&
    typeof channel.config === "object" &&
    channel.config !== null &&
    "botUsername" in channel.config &&
    typeof (channel.config as { botUsername?: unknown }).botUsername === "string"
      ? (channel.config as { botUsername: string }).botUsername
      : null;

  const canSave =
    accessValidation.ok && projectId && (hasBotToken || token.trim().length > 0);

  if (loading) {
    return <p className={styles.hint}>Đang tải…</p>;
  }

  return (
    <>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/dashboard/channel" className={styles.backLink}>
          ← Quay lại danh sách kênh
        </Link>
      </div>

      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 className={styles.headerTitle}>Thiết lập kênh Telegram</h1>
        <p className={styles.headerDesc}>
          Kết nối bot và cấu hình ai được chat DM với bot (dmPolicy / allowFrom).
        </p>
      </div>

      {channel?.enabled && channel.connectionStatus === "connected" ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Đã kết nối</h2>
          <p className={styles.statusMeta}>
            Bot: {botUsername ? `@${botUsername}` : "Telegram bot"}
            {channel.secrets[0]?.masked ? ` · Token: ${channel.secrets[0].masked}` : null}
            <br />
            DM: <strong>{savedAccess?.dmPolicy ?? dmPolicy}</strong>
            {savedAccess?.allowFromInput ? (
              <> · allowFrom: {savedAccess.allowFromInput.replace(/\n/g, ", ")}</>
            ) : null}
          </p>
          <Flex justify="end" style={{ marginTop: "var(--space-4)" }}>
            <Button variant="secondary" onClick={handleDisable} disabled={saving}>
              Tắt kênh
            </Button>
          </Flex>
        </div>
      ) : null}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Cách lấy Bot Token & User ID</h2>
        <ol className={styles.list}>
          <li>
            Token: tìm <strong>@BotFather</strong> → <code>/newbot</code> → copy HTTP API Token.
          </li>
          <li>
            User ID: tìm <strong>@userinfobot</strong> → gửi tin → copy số ID (vd.{" "}
            <code>8734062810</code>).
          </li>
          <li>
            Với <strong>allowlist</strong>, chỉ ID trong danh sách mới DM được bot.
          </li>
        </ol>
      </div>

      <div className={styles.botFormCard}>
        <div className={styles.fieldBlock}>
          <Select
            id="dm-policy"
            label="Chính sách DM (dmPolicy)"
            value={dmPolicy}
            onValueChange={(value) => setDmPolicy(value as TelegramDmPolicy)}
            options={TELEGRAM_DM_POLICY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
          {policyOption ? <p className={styles.policyHint}>{policyOption.description}</p> : null}
        </div>

        {dmPolicy === "open" ? (
          <div className={styles.warningBanner}>
            Bot ở chế độ <strong>mở</strong>: bất kỳ ai biết username bot đều có thể chat DM. Chỉ
            dùng cho demo; agent có tool mạnh cần hạn chế quyền.
          </div>
        ) : null}

        {dmPolicy !== "open" ? (
          <div className={styles.fieldBlock}>
            <label htmlFor="allow-from" className={styles.label}>
              Telegram user ID (allowFrom)
              {dmPolicy === "allowlist" ? " — bắt buộc" : " — tùy chọn"}
            </label>
            <textarea
              id="allow-from"
              className={styles.textarea}
              placeholder={"8734062810\n745123456"}
              value={allowFromInput}
              onChange={(e) => setAllowFromInput(e.target.value)}
              spellCheck={false}
            />
            <p className={styles.hint}>
              Một ID mỗi dòng (hoặc cách nhau bằng dấu phẩy). Prefix <code>telegram:</code> /{" "}
              <code>tg:</code> được chấp nhận.
            </p>
          </div>
        ) : null}

        <div className={styles.fieldBlock}>
          <label htmlFor="bot-token" className={styles.label}>
            Mã Token của Telegram Bot
            {hasBotToken ? " — để trống nếu chỉ đổi chính sách DM" : " — bắt buộc"}
          </label>
          <Input
            id="bot-token"
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <p className={styles.hint}>
            Token mã hóa trong DB; dmPolicy và allowFrom sync vào <code>openclaw.json</code>.
          </p>
        </div>

        {fieldError ? <p style={{ color: "var(--color-danger, #c0392b)" }}>{fieldError}</p> : null}
        {error ? <p style={{ color: "var(--color-danger, #c0392b)" }}>{error}</p> : null}
        {success ? <p style={{ color: "var(--color-success, #27ae60)" }}>{success}</p> : null}

        <Flex justify="end">
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "Đang lưu..." : channel?.enabled ? "Lưu thay đổi" : "Lưu kết nối"}
          </Button>
        </Flex>
      </div>
    </>
  );
}
