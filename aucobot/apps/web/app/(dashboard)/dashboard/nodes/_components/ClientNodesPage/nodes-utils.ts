import type {
  DevicePairingPending,
  NodeEntry,
  NodePairingPending,
} from "@/schemas/nodes.schema";

export type ApprovalGroup = {
  id: string;
  title: string;
  subtitle?: string;
  device?: DevicePairingPending;
  node?: NodePairingPending;
};

/** Pending device rows relevant to Companion Nodes (excludes SaaS gateway proxy). */
export function isNodeDeviceRequest(req: DevicePairingPending): boolean {
  const role = req.role?.trim().toLowerCase();
  const roles = (req.roles ?? []).map((r) => r.trim().toLowerCase());
  if (role === "node" || roles.includes("node")) return true;

  const clientId =
    typeof req.clientId === "string" ? req.clientId.trim().toLowerCase() : "";
  const clientMode =
    typeof req.clientMode === "string" ? req.clientMode.trim().toLowerCase() : "";
  if (clientId === "gateway-client" && clientMode === "backend") {
    return false;
  }

  // openclaw node run often creates an operator WS pairing request first
  if (role === "operator" || roles.includes("operator")) {
    return true;
  }

  return false;
}

export function formatCaps(values: unknown[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => String(v)).filter(Boolean).slice(0, 12);
}

export function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

export function buildApprovalGroups(
  devices: DevicePairingPending[],
  nodes: NodePairingPending[],
): ApprovalGroup[] {
  const groups: ApprovalGroup[] = [];
  const usedDevice = new Set<string>();
  const usedNode = new Set<string>();

  for (const nodeReq of nodes) {
    const match = devices.find(
      (d) =>
        !usedDevice.has(d.requestId) &&
        ((nodeReq.remoteIp &&
          d.remoteIp &&
          nodeReq.remoteIp === d.remoteIp) ||
          (nodeReq.displayName &&
            d.displayName &&
            nodeReq.displayName.trim() === d.displayName.trim())),
    );
    if (match) {
      usedDevice.add(match.requestId);
      usedNode.add(nodeReq.requestId);
      groups.push({
        id: `g-${match.requestId}-${nodeReq.requestId}`,
        title:
          nodeReq.displayName?.trim() ||
          match.displayName?.trim() ||
          nodeReq.nodeId ||
          match.deviceId,
        subtitle: [nodeReq.platform, nodeReq.remoteIp ?? match.remoteIp]
          .filter(Boolean)
          .join(" · "),
        device: match,
        node: nodeReq,
      });
    }
  }

  for (const d of devices) {
    if (!usedDevice.has(d.requestId)) {
      groups.push({
        id: `d-${d.requestId}`,
        title: d.displayName?.trim() || d.deviceId,
        subtitle: d.remoteIp ?? undefined,
        device: d,
      });
    }
  }

  for (const n of nodes) {
    if (!usedNode.has(n.requestId)) {
      groups.push({
        id: `n-${n.requestId}`,
        title: n.displayName?.trim() || n.nodeId,
        subtitle: [n.platform, n.remoteIp].filter(Boolean).join(" · "),
        node: n,
      });
    }
  }

  return groups;
}

export function getNodeTitle(node: NodeEntry): string {
  const nodeId = String(node.nodeId ?? "");
  return (
    (typeof node.displayName === "string" && node.displayName.trim()) ||
    nodeId ||
    "unknown"
  );
}

export function formatCountdownMs(expiresAt: string): string | null {
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return "Đã hết hạn";
  const totalSec = Math.floor(diff / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function inviteStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Đang hiệu lực";
    case "used":
      return "Đã dùng";
    case "expired":
      return "Hết hạn";
    default:
      return status;
  }
}
