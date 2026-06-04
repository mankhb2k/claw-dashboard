import { useState } from "preact/hooks";
import { formatZodErrors } from "@shared/parse";
import {
  connectPayloadSchema,
  connectWithInviteSchema,
  nodeConfigSchema,
  type ConnectPayload,
  type ConnectWithInvitePayload,
  type NodeConfig,
} from "@shared/schemas/node-config.schema";
import styles from "../styles/setupForm.module.css";

type SetupMode = "token" | "invite";

type SetupFormProps = {
  initial: NodeConfig | null;
  hasStoredToken: boolean;
  busy: boolean;
  onConnect: (payload: ConnectPayload) => Promise<{ ok: boolean; errors?: Record<string, string>; message?: string }>;
  onConnectWithInvite: (
    payload: ConnectWithInvitePayload,
  ) => Promise<{ ok: boolean; errors?: Record<string, string>; message?: string }>;
  onSave: (config: NodeConfig) => Promise<{ ok: boolean; errors?: Record<string, string> }>;
  onTest: (gatewayUrl: string) => Promise<{ ok: boolean; message?: string; errors?: Record<string, string> }>;
};

export function SetupForm({
  initial,
  hasStoredToken,
  busy,
  onConnect,
  onConnectWithInvite,
  onSave,
  onTest,
}: SetupFormProps) {
  const [mode, setMode] = useState<SetupMode>("invite");
  const [gatewayUrl, setGatewayUrl] = useState(initial?.gatewayUrl ?? "http://127.0.0.1:18789");
  const [gatewayToken, setGatewayToken] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(initial?.aucobotApiUrl ?? "http://localhost:3001");
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [aucobotWebUrl, setAucobotWebUrl] = useState(initial?.aucobotWebUrl ?? "");
  const [openAtLogin, setOpenAtLogin] = useState(initial?.openAtLogin ?? false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const handleConnectToken = async () => {
    setFormMessage(null);
    const payload = {
      gatewayUrl,
      gatewayToken: gatewayToken.trim() || undefined,
      displayName: displayName.trim() || undefined,
      aucobotWebUrl: aucobotWebUrl.trim() || undefined,
      aucobotApiUrl: apiBaseUrl.trim() || undefined,
      openAtLogin,
    };

    const parsed = connectPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(formatZodErrors(parsed.error));
      return;
    }
    if (!parsed.data.gatewayToken && !hasStoredToken) {
      setFieldErrors({ gatewayToken: "Gateway token is required" });
      return;
    }
    setFieldErrors({});

    const result = await onConnect(parsed.data);
    if (result.errors) setFieldErrors(result.errors);
    if (result.message) setFormMessage(result.message);
  };

  const handleConnectInvite = async () => {
    setFormMessage(null);
    const payload = {
      apiBaseUrl: apiBaseUrl.trim(),
      inviteCode: inviteCode.trim(),
      displayName: displayName.trim() || undefined,
      openAtLogin,
    };

    const parsed = connectWithInviteSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldErrors(formatZodErrors(parsed.error));
      return;
    }
    setFieldErrors({});

    const result = await onConnectWithInvite(parsed.data);
    if (result.errors) setFieldErrors(result.errors);
    if (result.message) setFormMessage(result.message);
  };

  const handleSave = async () => {
    setFormMessage(null);
    const parsed = nodeConfigSchema.safeParse({
      gatewayUrl,
      displayName: displayName.trim() || undefined,
      aucobotWebUrl: aucobotWebUrl.trim() || undefined,
      aucobotApiUrl: apiBaseUrl.trim() || undefined,
      openAtLogin,
    });
    if (!parsed.success) {
      setFieldErrors(formatZodErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    const result = await onSave(parsed.data);
    if (result.errors) {
      setFieldErrors(result.errors);
      return;
    }
    setFormMessage("Settings saved.");
  };

  const handleTest = async () => {
    setFormMessage(null);
    const result = await onTest(gatewayUrl);
    if (result.errors) {
      setFieldErrors(result.errors);
      return;
    }
    setFormMessage(result.message ?? (result.ok ? "Gateway reachable." : "Gateway test failed."));
  };

  return (
    <form
      class={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        void (mode === "invite" ? handleConnectInvite() : handleConnectToken());
      }}
    >
      <div class={styles.modeRow}>
        <button
          type="button"
          class={mode === "invite" ? styles.modeActive : styles.modeButton}
          onClick={() => setMode("invite")}
        >
          Pairing invite
        </button>
        <button
          type="button"
          class={mode === "token" ? styles.modeActive : styles.modeButton}
          onClick={() => setMode("token")}
        >
          Gateway token
        </button>
      </div>

      {mode === "invite" ? (
        <>
          <div class={styles.field}>
            <label class={styles.label} for="apiBaseUrl">
              AucoBot API URL
            </label>
            <span class={styles.hint}>Backend URL (default http://localhost:3001)</span>
            <input
              id="apiBaseUrl"
              class={styles.input}
              value={apiBaseUrl}
              onInput={(e) => setApiBaseUrl((e.target as HTMLInputElement).value)}
              placeholder="http://localhost:3001"
              autoComplete="off"
            />
            {fieldErrors.apiBaseUrl ? (
              <span class={styles.fieldError}>{fieldErrors.apiBaseUrl}</span>
            ) : null}
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="inviteCode">
              Pairing invite code
            </label>
            <span class={styles.hint}>Create on AucoBot Dashboard → Companion Nodes</span>
            <input
              id="inviteCode"
              class={styles.input}
              value={inviteCode}
              onInput={(e) => setInviteCode((e.target as HTMLInputElement).value)}
              placeholder="nd-inv-…"
              autoComplete="off"
            />
            {fieldErrors.inviteCode ? (
              <span class={styles.fieldError}>{fieldErrors.inviteCode}</span>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div class={styles.field}>
            <label class={styles.label} for="gatewayUrl">
              Gateway URL
            </label>
            <span class={styles.hint}>HTTP(S) base URL (e.g. http://127.0.0.1:18789)</span>
            <input
              id="gatewayUrl"
              class={styles.input}
              value={gatewayUrl}
              onInput={(e) => setGatewayUrl((e.target as HTMLInputElement).value)}
              placeholder="http://127.0.0.1:18789"
              autoComplete="off"
            />
            {fieldErrors.gatewayUrl ? (
              <span class={styles.fieldError}>{fieldErrors.gatewayUrl}</span>
            ) : null}
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="gatewayToken">
              Gateway access token
            </label>
            <span class={styles.hint}>Copy from AucoBot Settings → Gateway token</span>
            <input
              id="gatewayToken"
              class={styles.input}
              type="password"
              value={gatewayToken}
              onInput={(e) => setGatewayToken((e.target as HTMLInputElement).value)}
              placeholder={hasStoredToken ? "Token saved — enter to reconnect" : "Paste token"}
              autoComplete="off"
            />
            {fieldErrors.gatewayToken ? (
              <span class={styles.fieldError}>{fieldErrors.gatewayToken}</span>
            ) : null}
          </div>
        </>
      )}

      <div class={styles.field}>
        <label class={styles.label} for="displayName">
          Display name (optional)
        </label>
        <input
          id="displayName"
          class={styles.input}
          value={displayName}
          onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
          placeholder="My MacBook"
          maxLength={64}
        />
        {fieldErrors.displayName ? (
          <span class={styles.fieldError}>{fieldErrors.displayName}</span>
        ) : null}
      </div>

      {mode === "token" ? (
        <div class={styles.field}>
          <label class={styles.label} for="aucobotWebUrl">
            AucoBot dashboard URL (optional)
          </label>
          <input
            id="aucobotWebUrl"
            class={styles.input}
            value={aucobotWebUrl}
            onInput={(e) => setAucobotWebUrl((e.target as HTMLInputElement).value)}
            placeholder="http://localhost:3000"
          />
          {fieldErrors.aucobotWebUrl ? (
            <span class={styles.fieldError}>{fieldErrors.aucobotWebUrl}</span>
          ) : null}
        </div>
      ) : null}

      <label class={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={openAtLogin}
          onChange={(e) => setOpenAtLogin((e.target as HTMLInputElement).checked)}
        />
        Launch at login (minimized to tray)
      </label>

      {formMessage ? (
        <div
          class={
            formMessage === "Settings saved."
              ? styles.formNoticeSuccess
              : styles.formNoticeError
          }
        >
          {formMessage}
        </div>
      ) : null}
      {fieldErrors._form ? (
        <div class={styles.formNoticeError}>{fieldErrors._form}</div>
      ) : null}

      <div class={styles.actions}>
        <div class={styles.actionsPrimary}>
          <button type="submit" class={styles.buttonPrimary} disabled={busy}>
            Connect
          </button>
        </div>
        <div class={styles.actionsSecondary}>
          {mode === "token" ? (
            <button
              type="button"
              class={styles.buttonSecondary}
              disabled={busy}
              onClick={() => void handleTest()}
            >
              Test gateway
            </button>
          ) : null}
          <button
            type="button"
            class={styles.buttonSecondary}
            disabled={busy}
            onClick={() => void handleSave()}
          >
            Save settings
          </button>
        </div>
      </div>
    </form>
  );
}
