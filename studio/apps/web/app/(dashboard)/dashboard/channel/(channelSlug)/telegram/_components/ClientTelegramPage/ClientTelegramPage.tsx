"use client";

import {
  readTelegramAccessFromConfig,
  validateTelegramAccessForm,
  type TelegramDmPolicy,
} from "@claw-dashboard/shared";
import { useEffect, useMemo, useState } from "react";

import styles from "../../../channel-detail.module.css";
import { BackButton } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import { Input, Button, Select, Textarea } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";

import type { ProjectChannel } from "@/schemas/project.schema";

/** dmPolicy select order (labels from i18n). */
const TELEGRAM_DM_POLICY_UI_ORDER: TelegramDmPolicy[] = [
  "allowlist",
  "pairing",
  "open",
];

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
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [dmPolicy, setDmPolicy] = useState<TelegramDmPolicy>("allowlist");
  const [allowFromInput, setAllowFromInput] = useState("");
  const [channel, setChannel] = useState<ProjectChannel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [trackedProjectId, setTrackedProjectId] = useState(projectId);
  const [loading, setLoading] = useState(Boolean(projectId));

  if (projectId !== trackedProjectId) {
    setTrackedProjectId(projectId);
    setLoading(Boolean(projectId));
    setError(null);
  }

  useEffect(() => {
    if (!projectId) return;
    void (async () => {
      await Promise.resolve();
      try {
        const rows = await projectApi.listChannels(projectId);
        const row = rows.find((c) => c.channelId === "telegram") ?? null;
        setChannel(row);
        if (row) {
          const access = readTelegramAccessFromConfig(row.config);
          setDmPolicy(access.dmPolicy);
          setAllowFromInput(access.allowFromInput);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("channels.detail.errors.load"),
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, t]);

  const accessValidation = useMemo(
    () => validateTelegramAccessForm({ dmPolicy, allowFromInput }),
    [dmPolicy, allowFromInput],
  );

  const savedAccess = useMemo(
    () => (channel ? readTelegramAccessFromConfig(channel.config) : null),
    [channel],
  );

  const hasBotToken = Boolean(channel?.secrets.some((s) => s.key === "bot_token"));

  const policyOptions = useMemo(
    () =>
      TELEGRAM_DM_POLICY_UI_ORDER.map((value) => ({
        value,
        label: t(`channels.detail.telegram.dmPolicy.${value}.label`),
      })),
    [t],
  );

  const policyDescription = t(`channels.detail.telegram.dmPolicy.${dmPolicy}.description`);

  const allowFromLabel = `${t("channels.detail.telegram.form.allowFromLabel")}${
    dmPolicy === "allowlist"
      ? t("channels.detail.telegram.form.requiredSuffix")
      : t("channels.detail.telegram.form.optionalSuffix")
  }`;

  const allowFromHint = (
    <>
      {t("channels.detail.telegram.form.allowFromHintBefore")}{" "}
      <code>telegram:</code> / <code>tg:</code>{" "}
      {t("channels.detail.telegram.form.allowFromHintAfter")}
    </>
  );

  const handleSave = async () => {
    if (!projectId) return;

    if (!accessValidation.ok) {
      setFieldError(accessValidation.message);
      return;
    }

    const needsNewToken = !hasBotToken;
    if (needsNewToken && !token.trim()) {
      setFieldError(t("channels.detail.errors.tokenRequired"));
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
          throw new Error(test.message ?? t("channels.detail.errors.tokenVerify"));
        }
        row = await projectApi.updateChannel(projectId, row.id, {
          config: configPatch,
          enabled: true,
        });
        setToken("");
        setSuccess(test.message ?? t("channels.detail.success.telegramSavedEnabled"));
      } else if (row.connectionStatus === "connected") {
        row = await projectApi.updateChannel(projectId, row.id, {
          config: configPatch,
          enabled: true,
        });
        setSuccess(t("channels.detail.success.dmPolicyUpdated"));
      } else {
        setSuccess(t("channels.detail.success.configSavedRetry"));
      }

      setChannel(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("channels.detail.errors.save"));
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
      setSuccess(t("channels.detail.success.telegramDisabled"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("channels.detail.errors.disable"));
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
    return <p className={styles.hint}>{t("channels.detail.loading")}</p>;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <BackButton href="/dashboard/channel">Telegram channel setup</BackButton>
        <p className={styles.headerDesc}>
          Connect your bot and configure who can DM it (dmPolicy / allowFrom).
        </p>
      </div>

      {channel?.enabled && channel.connectionStatus === "connected" ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Connected</h2>
          <p className={styles.statusMeta}>
            Bot: {botUsername ? `@${botUsername}` : t("channels.detail.botFallback.telegram")}
            {channel.secrets[0]?.masked ? ` · Token: ${channel.secrets[0].masked}` : null}
            <br />
            DM: <strong>{savedAccess?.dmPolicy ?? dmPolicy}</strong>
            {savedAccess?.allowFromInput ? (
              <> · allowFrom: {savedAccess.allowFromInput.replace(/\n/g, ", ")}</>
            ) : null}
          </p>
          <Flex justify="end" className={styles.connectedActions}>
            <Button variant="secondary" onClick={handleDisable} disabled={saving}>
              Disable channel
            </Button>
          </Flex>
        </div>
      ) : null}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>How to get Bot Token & User ID</h2>
        <ol className={styles.list}>
          <li>
            Token: find <strong>@BotFather</strong> → <code>/newbot</code> → copy HTTP API Token.
          </li>
          <li>
            User ID: find <strong>@userinfobot</strong> → send a message → copy numeric ID (e.g.{" "}
            <code>8734062810</code>).
          </li>
          <li>
            With <strong>allowlist</strong>, only IDs in the list can DM the bot.
          </li>
        </ol>
      </div>

      <div className={styles.botFormCard}>
        <div className={styles.fieldBlock}>
          <Select
            id="dm-policy"
            label={t("channels.detail.telegram.form.dmPolicyLabel")}
            value={dmPolicy}
            onValueChange={(value) => setDmPolicy(value as TelegramDmPolicy)}
            options={policyOptions}
          />
          <p className={styles.policyHint}>{policyDescription}</p>
        </div>

        {dmPolicy === "open" ? (
          <div className={styles.warningBanner}>
            Bot is in <strong>open</strong> mode: anyone who knows the bot username can DM it. Use
            only for demos; agents with powerful tools should restrict access.
          </div>
        ) : null}

        {dmPolicy !== "open" ? (
          <div className={styles.fieldBlock}>
            <Textarea
              id="allow-from"
              label={allowFromLabel}
              placeholder={t("channels.detail.telegram.form.allowFromPlaceholder")}
              value={allowFromInput}
              onChange={(e) => setAllowFromInput(e.target.value)}
              spellCheck={false}
              hint={allowFromHint}
            />
          </div>
        ) : null}

        <div className={styles.fieldBlock}>
          <label htmlFor="bot-token" className={styles.label}>
            Telegram Bot Token
            {hasBotToken ? " — leave blank to change DM policy only" : " — required"}
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
            Token is encrypted in the database; dmPolicy and allowFrom sync to{" "}
            <code>openclaw.json</code>.
          </p>
        </div>

        {fieldError ? <p className={styles.messageError}>{fieldError}</p> : null}
        {error ? <p className={styles.messageError}>{error}</p> : null}
        {success ? <p className={styles.messageSuccess}>{success}</p> : null}

        <Flex justify="end">
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "Saving..." : channel?.enabled ? "Save changes" : "Save connection"}
          </Button>
        </Flex>
      </div>
    </>
  );
}
