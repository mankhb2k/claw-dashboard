"use client";

import React from "react";
import { Input, type InputSize } from "@/components/ui/Input/Input";
import { X } from "lucide-react";
import styles from "./SearchItem.module.css";

interface SearchItemProps {
  /** Current search text */
  value: string;
  /** Called when the input value changes */
  onChange: (value: string) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Input element id */
  id?: string;
  /** Extra wrapper class names */
  className?: string;
  /** Max width (e.g. '320px', 360) */
  maxWidth?: string | number;
  /** Input size — defaults to `md` */
  size?: InputSize;
  /** Margin 16px trên/dưới — dùng trên list page dưới TitleHeader */
  pageSpacing?: boolean;
}

export function SearchItem({
  value,
  onChange,
  placeholder = "Searching...",
  id = "search-input",
  className = "",
  maxWidth,
  size = "md",
  pageSpacing = false,
}: SearchItemProps) {
  const handleClear = () => {
    onChange("");
  };

  const customStyle = maxWidth
    ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }
    : undefined;

  return (
    <div
      className={`${styles.searchContainer} ${pageSpacing ? styles.pageSpacing : ""} ${className}`.trim()}
      style={customStyle}
      data-size={size}
    >
      <Input
        id={id}
        type="text"
        size={size}
        labelPosition="none"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        spellCheck={false}
        className={styles.searchInput}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
