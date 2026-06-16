"use client";

import { useCallback, useEffect, useState } from "react";
import type { MessageBoxProps } from "./message-box.types";

export type UseComposerDraftResult = {
  value: string;
  onChange: (value: string) => void;
  controlledDraft: boolean;
  draftResetKey: string | undefined;
  clearDraft: () => void;
};

function resolveInitialDraft(props: MessageBoxProps): string {
  const controlledDraft = props.onChange !== undefined;
  if (controlledDraft) return props.value ?? "";
  if ("defaultValue" in props) return props.defaultValue ?? "";
  return "";
}

function resolveDraftResetKey(props: MessageBoxProps): string | undefined {
  const enableAttachments = props.enableAttachments === true;
  const controlledDraft = props.onChange !== undefined;
  if (!enableAttachments || controlledDraft) return undefined;
  if ("draftResetKey" in props) return props.draftResetKey;
  return undefined;
}

export function useComposerDraft(props: MessageBoxProps): UseComposerDraftResult {
  const controlledDraft = props.onChange !== undefined;
  const draftResetKey = resolveDraftResetKey(props);

  const [localDraft, setLocalDraft] = useState(() => resolveInitialDraft(props));

  const value = controlledDraft ? (props.value ?? "") : localDraft;
  const onChange = controlledDraft ? props.onChange : setLocalDraft;

  const clearDraft = useCallback(() => {
    onChange("");
  }, [onChange]);

  useEffect(() => {
    if (controlledDraft || draftResetKey === undefined) return;
    setLocalDraft("");
  }, [controlledDraft, draftResetKey]);

  return {
    value,
    onChange,
    controlledDraft,
    draftResetKey,
    clearDraft,
  };
}
