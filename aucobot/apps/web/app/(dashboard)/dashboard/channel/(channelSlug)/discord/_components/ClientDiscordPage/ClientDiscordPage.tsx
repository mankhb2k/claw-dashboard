"use client";

import {
  readDiscordAccessFromConfig,
  DISCORD_DM_POLICY_OPTIONS,
  validateDiscordAccessForm,
  type DiscordDmPolicy,
} from "@aucobot/shared";
import { useEffect, useMemo, useState } from "react";

import styles from "../../../channel-detail.module.css";
import { BackButton } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import { Input, Button, Select } from "@/components/ui";
import { projectApi } from "@/lib/api/project";
import { useI18n } from "@/lib/i18n";

import type { ProjectChannel } from "@/schemas/project.schema";

interface Props {
  projectId: string;
}

function preserveBotMetadata(
  config: unknown,
  patch: { dmPolicy: DiscordDmPolicy; allowFrom: string[] },
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

export function ClientDiscordPage({ projectId }: Props) {
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [dmPolicy, setDmPolicy] = useState<DiscordDmPolicy>("pairing");
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
        const row = rows.find((c) => c.channelId === "discord") ?? null;
        setChannel(row);
        if (row) {
          const access = readDiscordAccessFromConfig(row.config);
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
    () => validateDiscordAccessForm({ dmPolicy, allowFromInput }),
    [dmPolicy, allowFromInput],
  );

  const savedAccess = useMemo(
    () => (channel ? readDiscordAccessFromConfig(channel.config) : null),
    [channel],
  );

  const hasBotToken = Boolean(channel?.secrets.some((s) => s.key === "bot_token"));
  const policyOption = DISCORD_DM_POLICY_OPTIONS.find((o) => o.value === dmPolicy);

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
      let row = channel ?? (await projectApi.getOrCreateChannel(projectId, "discord"));
      const configPatch = preserveBotMetadata(row.config, {
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
        setSuccess(test.message ?? t("channels.detail.success.discordSavedEnabled"));
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
      setSuccess(t("channels.detail.success.discordDisabled"));
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
        <BackButton href="/dashboard/channel">Discord channel setup</BackButton>
        <p className={styles.headerDesc}>
          Connect your bot and configure who can DM it (dmPolicy / allowFrom).
        </p>
      </div>

      {channel?.enabled && channel.connectionStatus === "connected" ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Connected</h2>
          <p className={styles.statusMeta}>
            Bot: {botUsername ? `@${botUsername}` : t("channels.detail.botFallback.discord")}
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
            Go to{" "}
            <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">
              Discord Developer Portal
            </a>{" "}
            → Application → Bot → Reset Token / Copy.
          </li>
          <li>
            Enable <strong>MESSAGE CONTENT INTENT</strong> (Privileged Gateway Intents) if the bot
            needs to read message content.
          </li>
          <li>
            User ID (snowflake): enable Developer Mode in Discord → right-click user → Copy User
            ID.
          </li>
        </ol>
      </div>

      <div className={styles.botFormCard}>
        <div className={styles.fieldBlock}>
          <Select
            id="dm-policy"
            label="DM policy (dmPolicy)"
            value={dmPolicy}
            onValueChange={(value) => setDmPolicy(value as DiscordDmPolicy)}
            options={DISCORD_DM_POLICY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
          {policyOption ? <p className={styles.policyHint}>{policyOption.description}</p> : null}
        </div>

        {dmPolicy === "open" ? (
          <div className={styles.warningBanner}>
            Bot is in <strong>open</strong> mode: anyone can DM the bot. Use only for demos.
          </div>
        ) : null}

        {dmPolicy !== "open" ? (
          <div className={styles.fieldBlock}>
            <label htmlFor="allow-from" className={styles.label}>
              Discord user ID (allowFrom)
              {dmPolicy === "allowlist" ? " — required" : " — optional"}
            </label>
            <textarea
              id="allow-from"
              className={styles.textarea}
              placeholder={"123456789012345678\n987654321098765432"}
              value={allowFromInput}
              onChange={(e) => setAllowFromInput(e.target.value)}
              spellCheck={false}
            />
            <p className={styles.hint}>
              One snowflake ID per line. Prefixes <code>discord:</code> / <code>user:</code> are
              accepted.
            </p>
          </div>
        ) : null}

        <div className={styles.fieldBlock}>
          <label htmlFor="bot-token" className={styles.label}>
            Discord Bot Token
            {hasBotToken ? " — leave blank to change DM policy only" : " — required"}
          </label>
          <Input
            id="bot-token"
            placeholder="MTA….Gcq….AbCd"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <p className={styles.hint}>
            Token is encrypted in the database; syncs to <code>channels.discord</code> in{" "}
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
