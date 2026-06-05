"use client";

import React from "react";
import { Input, type InputSize } from "@/components/ui/Input/Input";
import { X } from "lucide-react";
import styles from "./SearchItem.module.css";

interface SearchItemProps {
  /** Giá trị text tìm kiếm hiện tại */
  value: string;
  /** Callback sự kiện thay đổi giá trị nhập */
  onChange: (value: string) => void;
  /** Gợi ý hiển thị trong ô input */
  placeholder?: string;
  /** ID duy nhất cho thẻ input */
  id?: string;
  /** Tên class bổ sung bên ngoài */
  className?: string;
  /** Độ rộng tối đa (ví dụ: '320px', 360) */
  maxWidth?: string | number;
  /** Kích thước input — mặc định `sm` cho thanh tìm kiếm gọn */
  size?: InputSize;
}

export function SearchItem({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  id = "search-input",
  className = "",
  maxWidth,
  size = "sm",
}: SearchItemProps) {
  const handleClear = () => {
    onChange("");
  };

  const customStyle = maxWidth ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } : undefined;

  return (
    <div
      className={`${styles.searchContainer} ${size === "sm" ? styles.searchContainerSm : ""} ${className}`}
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
          aria-label="Xóa tìm kiếm"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
