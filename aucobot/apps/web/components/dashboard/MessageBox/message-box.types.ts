import type { SlashCommandItem } from "@/utils/chat/slash-command";
import type { ContextUsageSnapshot } from "./ContextUsageRing/context-usage.utils";
import type { ComposerSendPayload } from "./AttachmentPreviewRow/composer-attachments";

export type MessageBoxSelectOption = {
  value: string;
  label: string;
};

export type MessageBoxSharedProps = {
  sending: boolean;
  disabled?: boolean;
  placeholder?: string;
  providerId?: string;
  providerOptions: MessageBoxSelectOption[];
  onProviderChange: (providerId: string) => void;
  modelId?: string;
  modelOptions: MessageBoxSelectOption[];
  onModelChange: (model: string) => void;
  modelsLoading?: boolean;
  hint?: string;
  inputId?: string;
  ariaLabel?: string;
  composerId?: string;
};

/** Controlled — parent owns draft (AgentPanel, SkillAgentPanel). */
export type MessageBoxControlledDraft = {
  value: string;
  onChange: (value: string) => void;
};

/** Uncontrolled — draft stays in MessageBox; parent reads text only on send. */
export type MessageBoxLocalDraft = {
  value?: undefined;
  onChange?: undefined;
  defaultValue?: string;
  /** Clear draft when key changes (e.g. chat sessionKey). */
  draftResetKey?: string;
};

export type MessageBoxChatCoreProps = MessageBoxSharedProps & {
  onSend: (payload: ComposerSendPayload) => void;
  onAbort: () => void;
  canSend: boolean;
  /** User-invocable skill commands (built from current agent allowlist). */
  slashCommands?: SlashCommandItem[];
  modelSaving?: boolean;
  modelLabel?: string;
  contextUsage?: ContextUsageSnapshot;
  projectId?: string;
  sandboxActive?: boolean;
  stagingMaxBytes?: number;
};

export type MessageBoxChatProps = MessageBoxChatCoreProps & {
  enableAttachments: true;
} & (MessageBoxControlledDraft | MessageBoxLocalDraft);

/** Chat composer view — attachments always enabled; omit discriminant prop. */
export type MessageBoxChatViewProps = MessageBoxChatCoreProps &
  (MessageBoxControlledDraft | MessageBoxLocalDraft);

export type MessageBoxSimpleProps = MessageBoxSharedProps &
  MessageBoxControlledDraft & {
    enableAttachments?: false;
    onSend: () => void;
  };

export type MessageBoxProps = MessageBoxChatProps | MessageBoxSimpleProps;
