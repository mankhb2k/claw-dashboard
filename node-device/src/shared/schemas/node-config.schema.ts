import { z } from "zod";

export const nodeConnectionStateSchema = z.enum([
  "idle",
  "connecting",
  "awaiting_approval",
  "connected",
  "error",
]);

export type NodeConnectionState = z.infer<typeof nodeConnectionStateSchema>;

export const nodePermissionPrefsSchema = z.object({
  systemRun: z.boolean().optional(),
  systemWhich: z.boolean().optional(),
  execApprovals: z.boolean().optional(),
});

export type NodePermissionPrefs = z.infer<typeof nodePermissionPrefsSchema>;

export const nodeConfigSchema = z.object({
  gatewayUrl: z
    .string()
    .trim()
    .min(1, "Gateway URL is required")
    .refine(
      (value) => {
        try {
          const u = new URL(value);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return /^wss?:\/\/.+/i.test(value);
        }
      },
      { message: "Enter a valid http(s) or ws(s) gateway URL" },
    ),
  displayName: z.string().trim().min(1).max(64).optional(),
  aucobotWebUrl: z.string().url().optional().or(z.literal("")),
  /** @deprecated Stored for legacy; redeem uses web URL only. */
  aucobotApiUrl: z.string().url().optional().or(z.literal("")),
  openAtLogin: z.boolean().optional(),
  permissions: nodePermissionPrefsSchema.optional(),
});

export type NodeConfig = z.infer<typeof nodeConfigSchema>;

export const storedConfigSchema = nodeConfigSchema.extend({
  gatewayToken: z.string().trim().min(8).optional(),
});

export type StoredConfig = z.infer<typeof storedConfigSchema>;

export const connectPayloadSchema = nodeConfigSchema.extend({
  gatewayToken: z.string().trim().min(8, "Gateway token is required").optional(),
});

export type ConnectPayload = z.infer<typeof connectPayloadSchema>;

export const connectWithInviteSchema = z.object({
  webBaseUrl: z.string().trim().url("Dashboard URL is required"),
  inviteCode: z.string().trim().min(8, "Invite code is required"),
  displayName: z.string().trim().min(1).max(64).optional(),
  openAtLogin: z.boolean().optional(),
  permissions: nodePermissionPrefsSchema.optional(),
});

export type ConnectWithInvitePayload = z.infer<typeof connectWithInviteSchema>;

export const gatewayEndpointSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  useTls: z.boolean(),
  httpBase: z.string().url(),
});

export type GatewayEndpoint = z.infer<typeof gatewayEndpointSchema>;

export const ipcResultSchema = z.object({
  ok: z.boolean(),
  errors: z.record(z.string()).optional(),
  message: z.string().optional(),
});

export type IpcResult = z.infer<typeof ipcResultSchema>;
