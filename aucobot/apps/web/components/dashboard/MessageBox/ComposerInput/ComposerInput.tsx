"use client";

import type { RefObject } from "react";
import { Textarea } from "@/components/ui";
import type {
  ActiveSkillChip,
  SlashCommandItem,
} from "@/utils/chat/slash-command";
import { SlashCommandMenu } from "../SlashCommandMenu/SlashCommandMenu";
import styles from "../MessageBox.module.css";

export type ComposerInputProps = {
  inputId: string;
  placeholder: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  displayValue: string;
  inputDisabled: boolean;
  activeSkillChip: ActiveSkillChip | null;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  slashMenu?: {
    open: boolean;
    items: SlashCommandItem[];
    activeIndex: number;
    emptyMessage: string;
    onSelect: (item: SlashCommandItem) => void;
    onHighlight: (index: number) => void;
  };
};

export function ComposerInput({
  inputId,
  placeholder,
  textareaRef,
  displayValue,
  inputDisabled,
  activeSkillChip,
  onChange,
  onPaste,
  onKeyDown,
  slashMenu,
}: ComposerInputProps) {
  return (
    <div className={styles.inputArea}>
      {slashMenu ? (
        <SlashCommandMenu
          open={slashMenu.open}
          items={slashMenu.items}
          activeIndex={slashMenu.activeIndex}
          emptyMessage={slashMenu.emptyMessage}
          onSelect={slashMenu.onSelect}
          onHighlight={slashMenu.onHighlight}
        />
      ) : null}

      <div>
        {activeSkillChip ? (
          <span aria-hidden="true">{activeSkillChip.item.command}</span>
        ) : null}

        <Textarea
          ref={textareaRef}
          id={inputId}
          rows={1}
          className={styles.input}
          placeholder={activeSkillChip ? "Add a message…" : placeholder}
          value={displayValue}
          onChange={onChange}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          disabled={inputDisabled}
          aria-label="Message"
        />
      </div>
    </div>
  );
}
