"use client";

import { memo, useMemo, useState } from "react";

import {
  MessageBox,
  type ComposerSendPayload,
} from "@/components/chat/MessageBox";

import type { ContextUsageSnapshot } from "@/components/chat/MessageBox/ContextUsageRing/context-usage.utils";
import type { InvokableSkill } from "@/utils/chat/skill-slash";

type SelectOption = {
  value: string;
  label: string;
};

export type ChatComposerIslandProps = {
  sessionKey?: string;
  onSend: (payload: ComposerSendPayload) => void;
  onAbort: () => void;
  sending: boolean;
  canSend: boolean;
  disabled: boolean;
  ariaLabel: string;
  placeholder: string;
  providerId?: string;
  providerOptions: SelectOption[];
  onProviderChange: (providerId: string) => void;
  modelId?: string;
  modelOptions: SelectOption[];
  onModelChange: (model: string) => void;
  modelsLoading: boolean;
  modelSaving: boolean;
  modelHint?: string;
  contextUsage?: ContextUsageSnapshot;
  projectId?: string;
  sandboxActive?: boolean;
  stagingMaxBytes?: number;
  invokableSkills?: InvokableSkill[];
  invokableSkillsLoading?: boolean;
};

function ChatComposerIslandKeyed({
  onSend,
  onAbort,
  sending,
  canSend,
  disabled,
  ariaLabel,
  placeholder,
  providerId,
  providerOptions,
  onProviderChange,
  modelId,
  modelOptions,
  onModelChange,
  modelsLoading,
  modelSaving,
  modelHint,
  contextUsage,
  projectId,
  sandboxActive,
  stagingMaxBytes,
  invokableSkills,
  invokableSkillsLoading,
}: Omit<ChatComposerIslandProps, "sessionKey">) {
  const [input, setInput] = useState("");

  const modelLabel = useMemo(
    () => modelOptions.find((option) => option.value === modelId)?.label ?? modelId,
    [modelId, modelOptions],
  );

  return (
    <MessageBox
      enableAttachments
      value={input}
      onChange={setInput}
      onSend={onSend}
      onAbort={onAbort}
      sending={sending}
      canSend={canSend}
      disabled={disabled}
      inputId="chat-message-input"
      composerId="chat-composer"
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      providerId={providerId}
      providerOptions={providerOptions}
      onProviderChange={onProviderChange}
      modelId={modelId}
      modelOptions={modelOptions}
      onModelChange={onModelChange}
      modelsLoading={modelsLoading}
      modelSaving={modelSaving}
      hint={modelHint}
      modelLabel={modelLabel}
      contextUsage={contextUsage}
      projectId={projectId}
      sandboxActive={sandboxActive}
      stagingMaxBytes={stagingMaxBytes}
      invokableSkills={invokableSkills}
      invokableSkillsLoading={invokableSkillsLoading}
    />
  );
}

function ChatComposerIslandComponent({
  sessionKey,
  ...props
}: ChatComposerIslandProps) {
  return <ChatComposerIslandKeyed key={sessionKey ?? ""} {...props} />;
}

export const ChatComposerIsland = memo(ChatComposerIslandComponent);
