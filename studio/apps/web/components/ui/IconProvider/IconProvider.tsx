import Image from "next/image";
import * as React from "react";

import styles from "./IconProvider.module.css";
import { shouldUseUnoptimized } from "@/utils/image/app-image.utils";

import type { ImageProps } from "next/image";

export interface IconProviderProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  label?: string;
  fallbackText?: string;
  imageProps?: Omit<
    ImageProps,
    "src" | "alt" | "width" | "height" | "className"
  >;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "square" | "circle";
  withBackground?: boolean;
}

const ICON_SIZE_MAP = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 52,
};

function getFallbackLabel(value?: string) {
  if (!value) {
    return "?";
  }

  return value.trim().slice(0, 2).toUpperCase();
}

export function IconProvider({
  src,
  alt,
  label,
  fallbackText,
  imageProps,
  size = "md",
  shape = "square",
  withBackground = true,
  className,
  style,
  ...props
}: IconProviderProps) {
  const fallbackLabel = fallbackText ?? getFallbackLabel(label ?? alt);
  const imageSize = Math.round(ICON_SIZE_MAP[size] * 0.7);
  const ariaLabel = alt ?? label ?? "provider icon";

  const rootClasses = [
    styles.root,
    styles[`size_${size}`],
    styles[`shape_${shape}`],
    withBackground ? styles.withBackground : "",
    className ?? "",
  ].join(" ");

  const content = src ? (
    <Image
      className={styles.image}
      src={src}
      alt={alt ?? `${label ?? "provider"} icon`}
      width={imageSize}
      height={imageSize}
      unoptimized={shouldUseUnoptimized(src)}
      {...imageProps}
    />
  ) : (
    <span className={styles.fallback} aria-hidden="true">
      {fallbackLabel}
    </span>
  );

  return (
    <span className={rootClasses} style={style} aria-label={ariaLabel} {...props}>
      {content}
    </span>
  );
}
