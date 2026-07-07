export const OPENCLAW_CHANNEL_DEF_KINDS = ['bundled', 'external', 'web'] as const;

export type OpenClawChannelDefKind = (typeof OPENCLAW_CHANNEL_DEF_KINDS)[number];

export type OpenClawChannelDef = {
  id: string;
  docsPath: string;
  kind: OpenClawChannelDefKind;
};
