"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { MessageBoxSelectOption } from "../message-box.types";
import styles from "./SelectModelAI.module.css";

export type SelectModelAIProps = {
  id?: string;
  /** Selected option value (controlled). Empty/undefined shows the placeholder. */
  value?: string;
  options: MessageBoxSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

/**
 * Composer-only AI model/provider picker. Self-contained (no Radix) so it is
 * always controlled — no "uncontrolled to controlled" warning — and opens
 * upward to fit the bottom-docked composer without a portal.
 */
function SelectModelAIImpl({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Select",
  disabled = false,
  ariaLabel,
}: SelectModelAIProps) {
  const reactId = useId();
  const baseId = id ?? reactId;
  const listId = `${baseId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const isEmpty = options.length === 0;
  const isDisabled = disabled || isEmpty;

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  // Close when clicking outside the picker.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // When the menu opens, start navigation at the current selection.
  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    // Move focus into the list so arrow keys work immediately.
    listRef.current?.focus();
    // selectedIndex intentionally read once at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex] as
      | HTMLElement
      | undefined;
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const commit = useCallback(
    (option: MessageBoxSelectOption) => {
      onValueChange(option.value);
      close(true);
    },
    [onValueChange, close],
  );

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(options.length - 1, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) commit(option);
        break;
      }
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const activeOptionId =
    open && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        className={styles.trigger}
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={`${styles.value} ${selected ? "" : styles.placeholder}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={12} className={styles.icon} aria-hidden />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          className={styles.menu}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={activeOptionId}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                onPointerMove={() => setActiveIndex(index)}
                onClick={() => commit(option)}
              >
                <span className={styles.itemLabel}>{option.label}</span>
                {isSelected ? (
                  <Check size={14} className={styles.itemCheck} aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export const SelectModelAI = memo(SelectModelAIImpl);
