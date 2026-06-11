import * as React from "react";
import styles from "./IconProvider.module.css";

export interface IconProviderProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  label?: string;
  fallbackText?: string;
  imgProps?: Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "src" | "alt" | "className"
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
  imgProps,
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.image}
      src={src}
      alt={alt ?? `${label ?? "provider"} icon`}
      width={imageSize}
      height={imageSize}
      {...imgProps}
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
