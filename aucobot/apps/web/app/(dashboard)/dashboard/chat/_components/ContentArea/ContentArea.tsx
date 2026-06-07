"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import styles from "./ContentArea.module.css";

export type ContentAreaProps = {
  children: React.ReactNode;
  footer?: ReactNode;
  emptyState?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  /** Pin scroll to bottom when content changes. */
  autoScroll?: boolean;
  className?: string;
};

export function ContentArea({
  children,
  footer,
  emptyState,
  scrollRef: externalScrollRef,
  autoScroll = true,
  className,
}: ContentAreaProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  useEffect(() => {
    if (!autoScroll) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [children, autoScroll, scrollRef]);

  const showEmpty = Boolean(emptyState);

  return (
    <div
      className={[styles.root, className ?? ""].filter(Boolean).join(" ")}
      aria-label="Chat content"
    >
      <div ref={scrollRef} className={styles.scroll}>
        <div className={styles.thread}>
          {showEmpty ? (
            <div className={styles.emptyWrap}>{emptyState}</div>
          ) : (
            <div className={styles.messages}>{children}</div>
          )}
        </div>
      </div>

      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
