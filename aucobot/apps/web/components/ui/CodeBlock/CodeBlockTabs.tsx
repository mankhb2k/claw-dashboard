"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "./CodeBlockTabs.module.css";

export type CodeBlockTab<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type CodeBlockTabsProps<T extends string = string> = {
  items: readonly CodeBlockTab<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Nội dung bên phải hàng tab (vd. nhãn Terminal) */
  trailing?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

type IndicatorState = {
  left: number;
  width: number;
};

export function CodeBlockTabs<T extends string>({
  items,
  value,
  onValueChange,
  trailing,
  className = "",
  "aria-label": ariaLabel = "Code snippet language",
}: CodeBlockTabsProps<T>) {
  const tabListRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorState>({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const list = tabListRef.current;
    if (!list) {
      return;
    }

    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      setIndicator({ left: 0, width: 0 });
      return;
    }

    setIndicator({
      left: active.offsetLeft,
      width: active.offsetWidth,
    });
  }, []);

  useLayoutEffect(() => {
    updateIndicator();

    const list = tabListRef.current;
    if (!list) {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(list);

    return () => observer.disconnect();
  }, [value, items, updateIndicator]);

  const rootClass = [styles.root, className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div
        ref={tabListRef}
        className={styles.tabList}
        role="tablist"
        aria-label={ariaLabel}
      >
        {items.map((item) => {
          const isActive = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`code-block-tab-${item.value}`}
              aria-selected={isActive}
              aria-controls={`code-block-panel-${item.value}`}
              data-active={isActive ? "true" : "false"}
              disabled={item.disabled}
              className={styles.tab}
              onClick={() => onValueChange(item.value)}
            >
              {item.icon ? (
                <span className={styles.tabIcon} aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              {item.label}
            </button>
          );
        })}
        <span
          className={styles.indicator}
          aria-hidden
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      </div>
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </div>
  );
}
