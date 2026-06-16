"use client";

import type { SlashCommandItem } from "@/utils/chat/slash-command";
import styles from "./SlashCommandMenu.module.css";

export type SlashCommandMenuProps = {
  open: boolean;
  items: SlashCommandItem[];
  activeIndex: number;
  emptyMessage: string;
  onSelect: (item: SlashCommandItem) => void;
  onHighlight: (index: number) => void;
};

export function SlashCommandMenu({
  open,
  items,
  activeIndex,
  emptyMessage,
  onSelect,
  onHighlight,
}: SlashCommandMenuProps) {
  if (!open) return null;

  return (
    <div className={styles.root} role="listbox" aria-label="Slash commands">
      <div className={styles.label}>Skills</div>
      {items.length === 0 ? (
        <div className={styles.empty} role="status">
          {emptyMessage}
        </div>
      ) : (
        items.map((item, index) => (
          <button
            key={`${item.skillName}-${item.command}`}
            type="button"
            className={`${styles.item} ${
              index === activeIndex ? styles.itemActive : ""
            }`}
            onMouseEnter={() => onHighlight(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item)}
            role="option"
            aria-selected={index === activeIndex}
          >
            <div className={styles.itemBody}>
              <div className={styles.itemTitle}>{item.command}</div>
              <div className={styles.itemDesc}>
                {item.description ?? item.skillName}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
