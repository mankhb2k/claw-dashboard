"use client";

import * as React from "react";
import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "./Tabs.module.css";

export type TabBadgeTone = "default" | "danger";

export type TabItem = {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  badge?: React.ReactNode;
  badgeTone?: TabBadgeTone;
  disabled?: boolean;
};

export type TabsVariant = "section" | "panel";

export type TabsProps = {
  items: readonly TabItem[];
  value: string;
  onValueChange?: (value: string) => void;
  /** Sliding underline under the active tab */
  showIndicator?: boolean;
  variant?: TabsVariant;
  className?: string;
  style?: React.CSSProperties;
  trailing?: React.ReactNode;
  trailingClassName?: string;
  "aria-label"?: string;
};

type IndicatorState = {
  left: number;
  width: number;
};

export function Tabs({
  items,
  value,
  onValueChange,
  showIndicator = true,
  variant = "section",
  className = "",
  style,
  trailing,
  trailingClassName = "",
  "aria-label": ariaLabel = "Tabs",
}: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorAnimatedRef = useRef(false);
  const [indicator, setIndicator] = useState<IndicatorState>({
    left: 0,
    width: 0,
  });
  const [indicatorAnimated, setIndicatorAnimated] = useState(false);

  const updateIndicator = useCallback(() => {
    if (!showIndicator) {
      return;
    }

    const list = listRef.current;
    if (!list) {
      return;
    }

    const active = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      setIndicator({ left: 0, width: 0 });
      return;
    }

    const next = {
      left: active.offsetLeft,
      width: active.offsetWidth,
    };

    setIndicator(next);

    if (next.width > 0 && !indicatorAnimatedRef.current) {
      indicatorAnimatedRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIndicatorAnimated(true));
      });
    }
  }, [showIndicator]);

  useLayoutEffect(() => {
    updateIndicator();

    const list = listRef.current;
    if (!list) {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(list);

    return () => observer.disconnect();
  }, [value, items, updateIndicator, showIndicator]);

  useLayoutEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateIndicator]);

  const rootClass = [
    variant === "panel" ? styles.rootPanel : styles.rootSection,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const listClass = [
    styles.tabList,
    variant === "panel" ? styles.tabListPanel : styles.tabListSection,
  ].join(" ");

  const tabClass = variant === "panel" ? styles.tabPanel : styles.tabSection;

  const renderTabContent = (item: TabItem) => (
    <>
      {item.icon ? (
        <span className={styles.tabIcon} aria-hidden>
          {item.icon}
        </span>
      ) : null}
      {item.label}
      {item.badge != null ? (
        <span
          className={[
            styles.badge,
            item.badgeTone === "danger" ? styles.badgeDanger : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {item.badge}
        </span>
      ) : null}
    </>
  );

  const listInner = (
    <div
      ref={listRef}
      className={listClass}
      role="tablist"
      aria-label={ariaLabel}
    >
      {showIndicator ? (
        <span
          className={[
            styles.indicator,
            indicatorAnimated ? styles.indicatorAnimated : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
      ) : null}
      {items.map((item) => {
        const isActive = item.value === value;
        const sharedClass = [styles.tab, tabClass].join(" ");
        const dataActive = isActive ? "true" : "false";

        if (item.href) {
          return (
            <Link
              key={item.value}
              href={item.href}
              role="tab"
              aria-current={isActive ? "page" : undefined}
              data-active={dataActive}
              className={sharedClass}
            >
              {renderTabContent(item)}
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-active={dataActive}
            disabled={item.disabled}
            className={sharedClass}
            onClick={() => onValueChange?.(item.value)}
          >
            {renderTabContent(item)}
          </button>
        );
      })}
    </div>
  );

  if (variant === "panel") {
    return (
      <div className={rootClass} style={style}>
        <div className={styles.listWrapPanel}>{listInner}</div>
        {trailing ? (
          <div
            className={[styles.trailing, trailingClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {trailing}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <nav className={rootClass} style={style}>
      {listInner}
    </nav>
  );
}
