"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { SlashCommandItem } from "@/utils/chat/slash-command";
import {
  parseActiveSkillChip,
  resolveSlashTokenAtCaret,
} from "@/utils/chat/slash-command";

export type UseSlashComposerParams = {
  enabled: boolean;
  slashCommands: SlashCommandItem[];
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  draftResetKey?: string;
};

export type UseSlashComposerResult = {
  slashOpen: boolean;
  filteredSlashCommands: SlashCommandItem[];
  slashActiveIndex: number;
  setSlashActiveIndex: (index: number) => void;
  activeSkillChip: ReturnType<typeof parseActiveSkillChip>;
  updateSlashMenuFromValue: (nextValue: string, caretPos: number) => void;
  insertSlashCommand: (item: SlashCommandItem) => void;
  /** Returns true when the key event was handled (slash menu or skill chip backspace). */
  handleComposerKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

function filterSlashCommands(
  slashCommands: SlashCommandItem[],
  query: string,
): SlashCommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return slashCommands;

  return slashCommands.filter((item) => {
    const command = item.command.toLowerCase();
    const withoutSlash = command.startsWith("/") ? command.slice(1) : command;
    return (
      withoutSlash.startsWith(q) ||
      item.skillName.toLowerCase().startsWith(q) ||
      item.skillName.toLowerCase().includes(q)
    );
  });
}

export function useSlashComposer({
  enabled,
  slashCommands,
  value,
  onChange,
  textareaRef,
  draftResetKey,
}: UseSlashComposerParams): UseSlashComposerResult {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashTokenRange, setSlashTokenRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [slashActiveIndex, setSlashActiveIndex] = useState(0);

  const resetSlashMenu = useCallback(() => {
    setSlashOpen(false);
    setSlashQuery("");
    setSlashTokenRange(null);
    setSlashActiveIndex(0);
  }, []);

  useEffect(() => {
    if (!enabled || draftResetKey === undefined) return;
    resetSlashMenu();
  }, [draftResetKey, enabled, resetSlashMenu]);

  const filteredSlashCommands = useMemo(() => {
    if (!slashOpen) return [];
    return filterSlashCommands(slashCommands, slashQuery);
  }, [slashCommands, slashOpen, slashQuery]);

  const activeSkillChip = useMemo(
    () => parseActiveSkillChip(value, slashCommands, slashOpen),
    [slashCommands, slashOpen, value],
  );

  const updateSlashMenuFromValue = useCallback(
    (nextValue: string, caretPos: number) => {
      if (!enabled) {
        resetSlashMenu();
        return;
      }

      const resolved = resolveSlashTokenAtCaret(nextValue, caretPos);
      if (!resolved) {
        resetSlashMenu();
        return;
      }

      setSlashOpen(true);
      setSlashQuery(resolved.query);
      setSlashTokenRange({ start: resolved.tokenStart, end: resolved.tokenEnd });
      setSlashActiveIndex(0);
    },
    [enabled, resetSlashMenu],
  );

  const insertSlashCommand = useCallback(
    (item: SlashCommandItem) => {
      if (!slashTokenRange) return;
      const nextValue =
        value.slice(0, slashTokenRange.start) +
        item.command +
        " " +
        value.slice(slashTokenRange.end);

      onChange(nextValue);
      resetSlashMenu();

      // Height is handled by the composer's layout effect on the value change.
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        const caret = slashTokenRange.start + item.command.length + 1;
        el.selectionStart = caret;
        el.selectionEnd = caret;
        el.focus();
      });
    },
    [onChange, resetSlashMenu, slashTokenRange, textareaRef, value],
  );

  const handleComposerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (
        activeSkillChip &&
        event.key === "Backspace" &&
        activeSkillChip.body.length === 0 &&
        (event.currentTarget.selectionStart ?? 0) === 0
      ) {
        event.preventDefault();
        onChange(activeSkillChip.item.command);
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (!el) return;
          el.selectionStart = activeSkillChip.item.command.length;
          el.selectionEnd = activeSkillChip.item.command.length;
          updateSlashMenuFromValue(
            activeSkillChip.item.command,
            activeSkillChip.item.command.length,
          );
        });
        return true;
      }

      if (!enabled || !slashOpen) return false;

      if (event.key === "Escape") {
        event.preventDefault();
        resetSlashMenu();
        return true;
      }

      if (filteredSlashCommands.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashActiveIndex((prev) => {
            const next = prev + 1;
            return next >= filteredSlashCommands.length ? 0 : next;
          });
          return true;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashActiveIndex((prev) => {
            const next = prev - 1;
            return next < 0
              ? Math.max(0, filteredSlashCommands.length - 1)
              : next;
          });
          return true;
        }

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          const item = filteredSlashCommands[slashActiveIndex];
          if (item) insertSlashCommand(item);
          return true;
        }
      } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        return true;
      }

      return false;
    },
    [
      activeSkillChip,
      enabled,
      filteredSlashCommands,
      insertSlashCommand,
      onChange,
      resetSlashMenu,
      slashActiveIndex,
      slashOpen,
      textareaRef,
      updateSlashMenuFromValue,
    ],
  );

  return {
    slashOpen,
    filteredSlashCommands,
    slashActiveIndex,
    setSlashActiveIndex,
    activeSkillChip,
    updateSlashMenuFromValue,
    insertSlashCommand,
    handleComposerKeyDown,
  };
}
