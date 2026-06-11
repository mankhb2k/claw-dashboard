import React from "react";
import styles from "./Spinner.module.css";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Spinner({
  size = "md",
  loading = true,
  className = "",
  style,
  ...props
}: SpinnerProps) {
  if (!loading) return null;

  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
