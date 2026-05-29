"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import styles from "./BackButton.module.css";

const DEFAULT_HREF = "/dashboard/agent";
const ICON_SIZE = 18;

export interface BackButtonProps {
  /** Destination URL when clicked (default: /dashboard/agent) */
  href?: string;
  /** Override navigation behavior */
  onClick?: () => void;
  /** Label displayed next to icon — entire button region */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
  disabled?: boolean;
}

export function BackButton({
  href = DEFAULT_HREF,
  onClick,
  children,
  className = "",
  disabled = false,
}: BackButtonProps) {
  const router = useRouter();
  const hasLabel =
    children !== undefined && children !== null && children !== false;

  const handleClick = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
      return;
    }
    router.push(href);
  };

  const rootClass = [
    styles.root,
    hasLabel ? styles.withLabel : styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={rootClass}
      onClick={handleClick}
      disabled={disabled}
      aria-label={hasLabel ? undefined : "Back"}
    >
      <ArrowLeft size={ICON_SIZE} aria-hidden className={styles.icon} />
      {hasLabel ? <span className={styles.label}>{children}</span> : null}
    </button>
  );
}
