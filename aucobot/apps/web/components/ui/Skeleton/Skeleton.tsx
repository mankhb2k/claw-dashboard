"use client";

import * as React from "react";
import styles from "./Skeleton.module.css";

export type SkeletonVariant = "block" | "text" | "textSm" | "circle";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  pulse?: boolean;
}

function toCssSize(value: string | number): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton({
  variant = "block",
  width,
  height,
  pulse = true,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const classes = [
    styles.root,
    variant === "text" ? styles.text : "",
    variant === "textSm" ? styles.textSm : "",
    variant === "circle" ? styles.circle : "",
    pulse ? styles.pulse : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const sizeStyle: React.CSSProperties = {
    ...(width != null ? { width: toCssSize(width) } : {}),
    ...(height != null ? { height: toCssSize(height) } : {}),
  };

  const mergedStyle =
    Object.keys(sizeStyle).length > 0 ? { ...sizeStyle, ...style } : style;

  return (
    <div
      className={classes}
      style={mergedStyle}
      aria-hidden
      data-slot="skeleton"
      {...props}
    />
  );
}
