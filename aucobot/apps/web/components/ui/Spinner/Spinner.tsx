import React from "react";
import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
}

export function Spinner({ size = "md", loading = true, className = "" }: SpinnerProps) {
  if (!loading) return null;

  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
