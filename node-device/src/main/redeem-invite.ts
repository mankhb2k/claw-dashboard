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

/** Redeem via dashboard origin only (`/api/nodes/invites/redeem` — Next rewrite, no API host in app). */
export function redeemApiBaseFromWebUrl(webBaseUrl: string): string {
  return webBaseUrl.trim().replace(/\/$/, "");
}

export async function redeemNodeInvite(
  webBaseUrl: string,
  code: string,
): Promise<{ ok: true; data: RedeemInviteResult } | { ok: false; message: string }> {
  const base = redeemApiBaseFromWebUrl(webBaseUrl);
  try {
    const res = await fetch(`${base}/api/nodes/invites/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const json = (await res.json()) as ApiEnvelope<RedeemInviteResult>;
    if (!res.ok || !json.success || !json.data) {
      const raw =
        (typeof json.error === "object" && json.error?.message) ||
        (typeof json.error === "string" && json.error) ||
        `Redeem failed (HTTP ${res.status})`;
      const message =
        raw === "Invite already used"
          ? "Mã invite đã được sử dụng."
          : raw === "Invite expired"
            ? "Mã invite đã hết hạn."
            : raw;
      return { ok: false, message };
    }
    return { ok: true, data: json.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach dashboard";
    return { ok: false, message };
  }
}
