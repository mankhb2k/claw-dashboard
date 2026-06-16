"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import styles from "./ContentArea.module.css";

const BOTTOM_THRESHOLD_PX = 80;

function isNearBottom(el: HTMLElement, threshold = BOTTOM_THRESHOLD_PX): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
}

export type ContentAreaProps = {
  children: React.ReactNode;
  footer?: ReactNode;
  emptyState?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  /** When this changes (e.g. session switch), scroll resets to the bottom once. */
  scrollResetKey?: string;
  /** Pin scroll to bottom only while the user is already near the bottom. */
  autoScroll?: boolean;
  className?: string;
};

export function ContentArea({
  children,
  footer,
  emptyState,
  scrollRef: externalScrollRef,
  scrollResetKey,
  autoScroll = true,
  className,
}: ContentAreaProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const stickToBottomRef = useRef(true);
  const prevResetKeyRef = useRef(scrollResetKey);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = isNearBottom(el);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll, scrollRef]);

  useEffect(() => {
    if (scrollResetKey === undefined) return;
    if (prevResetKeyRef.current === scrollResetKey) return;
    prevResetKeyRef.current = scrollResetKey;
    stickToBottomRef.current = true;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [scrollResetKey, scrollRef]);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
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
