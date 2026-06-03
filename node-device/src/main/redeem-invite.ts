export type RedeemInviteResult = {
  gatewayUrl: string;
  gatewayToken: string;
  aucobotWebUrl: string;
  projectId: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { message?: string } | string | null;
};

export async function redeemNodeInvite(
  apiBaseUrl: string,
  code: string,
): Promise<{ ok: true; data: RedeemInviteResult } | { ok: false; message: string }> {
  const base = apiBaseUrl.trim().replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/api/nodes/invites/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const json = (await res.json()) as ApiEnvelope<RedeemInviteResult>;
    if (!res.ok || !json.success || !json.data) {
      const message =
        (typeof json.error === "object" && json.error?.message) ||
        (typeof json.error === "string" && json.error) ||
        `Redeem failed (HTTP ${res.status})`;
      return { ok: false, message };
    }
    return { ok: true, data: json.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach AucoBot API";
    return { ok: false, message };
  }
}
