import { z } from "zod";

const looseRecord = z.record(z.string(), z.unknown());

export const nodeEntrySchema = z
  .object({
    nodeId: z.string().optional(),
    displayName: z.string().optional(),
    platform: z.string().optional(),
    version: z.string().optional(),
    remoteIp: z.string().optional(),
    connected: z.boolean().optional(),
    paired: z.boolean().optional(),
    caps: z.array(z.unknown()).optional(),
    commands: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const nodesListResponseSchema = z.object({
  ts: z.number().optional(),
  nodes: z.array(nodeEntrySchema),
});

export const devicePairingPendingSchema = z
  .object({
    requestId: z.string(),
    deviceId: z.string(),
    displayName: z.string().optional(),
    role: z.string().optional(),
    roles: z.array(z.string()).optional(),
    scopes: z.array(z.string()).optional(),
    remoteIp: z.string().optional(),
    isRepair: z.boolean().optional(),
    ts: z.number().optional(),
  })
  .passthrough();

export const nodePairingPendingSchema = z
  .object({
    requestId: z.string(),
    nodeId: z.string(),
    displayName: z.string().optional(),
    platform: z.string().optional(),
    deviceFamily: z.string().optional(),
    caps: z.array(z.string()).optional(),
    commands: z.array(z.string()).optional(),
    requiredApproveScopes: z.array(z.string()).optional(),
    remoteIp: z.string().optional(),
    ts: z.number().optional(),
  })
  .passthrough();

export const nodesPairingResponseSchema = z.object({
  devices: z.object({
    pending: z.array(devicePairingPendingSchema),
    paired: z.array(looseRecord),
  }),
  nodes: z.object({
    pending: z.array(nodePairingPendingSchema),
    paired: z.array(looseRecord),
  }),
});

export const renameNodeInputSchema = z.object({
  displayName: z.string().min(1).max(120),
});

export type NodeEntry = z.infer<typeof nodeEntrySchema>;
export type NodesListResponse = z.infer<typeof nodesListResponseSchema>;
export type NodesPairingResponse = z.infer<typeof nodesPairingResponseSchema>;
export type DevicePairingPending = z.infer<typeof devicePairingPendingSchema>;
export type NodePairingPending = z.infer<typeof nodePairingPendingSchema>;
export type RenameNodeInput = z.infer<typeof renameNodeInputSchema>;

export const nodeInviteStatusSchema = z.enum(["active", "used", "expired"]);

export const nodeInviteListItemSchema = z.object({
  id: z.string(),
  codePrefix: z.string(),
  label: z.string().nullable(),
  expiresAt: z.string(),
  usedAt: z.string().nullable(),
  createdAt: z.string(),
  status: nodeInviteStatusSchema,
});

export const nodeInviteCreatedSchema = z.object({
  invite: nodeInviteListItemSchema,
  code: z.string(),
});

export const nodeInviteListResponseSchema = z.array(nodeInviteListItemSchema);

export const createNodeInviteInputSchema = z.object({
  label: z.string().max(80).optional(),
  ttlMinutes: z.number().int().min(5).max(60).optional(),
});

export const redeemNodeInviteInputSchema = z.object({
  code: z.string().min(8).max(128),
});

export const redeemNodeInviteResponseSchema = z.object({
  gatewayUrl: z.string(),
  gatewayToken: z.string(),
  clawDashboardWebUrl: z.string(),
  projectId: z.string(),
});

export type NodeInviteListItem = z.infer<typeof nodeInviteListItemSchema>;
export type NodeInviteCreated = z.infer<typeof nodeInviteCreatedSchema>;
export type CreateNodeInviteInput = z.infer<typeof createNodeInviteInputSchema>;
export type RedeemNodeInviteResponse = z.infer<typeof redeemNodeInviteResponseSchema>;
