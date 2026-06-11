"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Typography } from "@/components/ui/Typography/Typography";
import { Check, Copy } from "lucide-react";
import { CodeBlockTabs, type CodeBlockTab } from "./CodeBlockTabs";
import styles from "./CodeBlock.module.css";

export type { CodeBlockTab } from "./CodeBlockTabs";
export { CodeBlockTabs } from "./CodeBlockTabs";

export type CodeBlockProps<T extends string = string> = {
  /** Source copied to clipboard and shown in the block */
  code: string;
  /** Header label when not using headerStart */
  title?: string;
  /** Optional icon beside title */
  icon?: React.ReactNode;
  /** Tab bar with sliding underline (thay ToggleGroup) */
  tabs?: readonly CodeBlockTab<T>[];
  activeTab?: T;
  onTabChange?: (value: T) => void;
  /** Nhãn / action bên phải hàng tab */
  tabTrailing?: React.ReactNode;
  /** Left side of header (custom chrome; không dùng cùng tabs) */
  headerStart?: React.ReactNode;
  /** Extra actions before Copy */
  headerActions?: React.ReactNode;
  /** Show header bar (default: true if title, icon, headerStart, headerActions, or copy) */
  showHeader?: boolean;
  /** Show copy button in header (default: true) */
  showCopy?: boolean;
  /** Called after a successful copy */
  onCopy?: () => void;
  /** Max height for scrollable code area */
  maxHeight?: number | string;
  variant?: "default" | "compact";
  className?: string;
  style?: React.CSSProperties;
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text.trim()) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export function CodeBlock<T extends string = string>({
  code,
  title,
  icon,
  tabs,
  activeTab,
  onTabChange,
  tabTrailing,
  headerStart,
  headerActions,
  showHeader,
  showCopy = true,
  onCopy,
  maxHeight,
  variant = "default",
  className = "",
  style,
}: CodeBlockProps<T>) {
  const [copied, setCopied] = useState(false);
  const compact = variant === "compact";
  const hasTabs = Boolean(tabs?.length);
  const tabValue = activeTab ?? tabs?.[0]?.value;
  const activePanelId =
    tabValue !== undefined ? `code-block-panel-${tabValue}` : undefined;

  const shouldShowHeader =
    showHeader ??
    Boolean(
      title ||
        icon ||
        hasTabs ||
        headerStart ||
        headerActions ||
        showCopy,
    );

  const canCopy = showCopy && code.trim().length > 0;

  const handleCopy = useCallback(async () => {
    const ok = await copyTextToClipboard(code);
    if (!ok) {
      return;
    }
    setCopied(true);
    onCopy?.();
  }, [code, onCopy]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const rootClass = [
    styles.root,
    compact ? styles.rootCompact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const headerClass = [
    styles.header,
    compact ? styles.headerCompact : "",
    hasTabs && !title && !icon ? styles.headerTabbed : "",
    hasTabs && !title && !icon && compact ? styles.headerTabbedCompact : "",
  ]
    .filter(Boolean)
    .join(" ");

  const copyButton =
    canCopy ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!code.trim()}
        onClick={() => void handleCopy()}
        aria-label={title ? `Copy ${title}` : "Copy code to clipboard"}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {copied ? "Copied" : "Copy"}
      </Button>
    ) : null;

  const preClass = [styles.pre, compact ? styles.preCompact : ""]
    .filter(Boolean)
    .join(" ");

  const bodyStyle =
    maxHeight !== undefined
      ? ({
          ["--code-block-max-height" as string]:
            typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        } as React.CSSProperties)
      : undefined;

  const bodyClass = [
    styles.body,
    maxHeight !== undefined ? styles.bodyLimited : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} style={style}>
      {shouldShowHeader ? (
        <div className={headerClass}>
          {hasTabs && !title && !icon ? (
            <div className={styles.headerTabRow}>
              {tabs && tabValue !== undefined && onTabChange ? (
                <CodeBlockTabs
                  className={styles.headerTabs}
                  items={tabs}
                  value={tabValue}
                  onValueChange={onTabChange}
                  trailing={tabTrailing}
                />
              ) : null}
              {headerActions || copyButton ? (
                <div className={styles.headerEnd}>
                  {headerActions}
                  {copyButton}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className={styles.headerStart}>
                {icon ? <span className={styles.headerIcon}>{icon}</span> : null}
                {title ? (
                  <Typography variant="small" weight="medium" className={styles.title}>
                    {title}
                  </Typography>
                ) : null}
                {hasTabs && tabs && tabValue !== undefined && onTabChange ? (
                  <CodeBlockTabs
                    items={tabs}
                    value={tabValue}
                    onValueChange={onTabChange}
                    trailing={tabTrailing}
                  />
                ) : (
                  headerStart
                )}
              </div>
              {headerActions || copyButton ? (
                <div className={styles.headerEnd}>
                  {headerActions}
                  {copyButton}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className={bodyClass} style={bodyStyle}>
        <pre
          className={preClass}
          role={hasTabs ? "tabpanel" : undefined}
          id={activePanelId}
          aria-labelledby={
            tabValue !== undefined ? `code-block-tab-${tabValue}` : undefined
          }
        >
          <code className={styles.code}>{code}</code>
        </pre>
      </div>
    </div>
  );
}
