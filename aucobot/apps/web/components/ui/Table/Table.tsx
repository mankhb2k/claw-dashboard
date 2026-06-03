import * as React from "react";
import { Typography } from "../Typography/Typography";
import styles from "./Table.module.css";

export type TableAlign = "left" | "center" | "right";
export type TableSize = "sm" | "md";

const ALIGN_CLASS: Record<TableAlign, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
  right: styles.alignRight,
};

function cn(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(" ");
}

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bật cuộn ngang khi bảng rộng */
  scrollable?: boolean;
  /** Khoảng cách ô */
  size?: TableSize;
}

/** Vỏ bảng + `<table>` — dùng kèm Header / Body / Row / Head / Cell */
export function Table({
  scrollable = false,
  size = "md",
  className,
  children,
  ...props
}: TableProps) {
  return (
    <div
      className={cn(styles.wrapper, scrollable && styles.scrollable, className)}
      {...props}
    >
      <table
        className={cn(
          styles.table,
          size === "sm" ? styles.sizeSm : styles.sizeMd,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(styles.header, className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(styles.body, className)} {...props} />;
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={className} {...props} />;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Highlight khi hover */
  hoverable?: boolean;
  /** Dòng đang chọn */
  selected?: boolean;
}

export function TableRow({
  hoverable = false,
  selected = false,
  className,
  ...props
}: TableRowProps) {
  return (
    <tr
      className={cn(
        hoverable && styles.rowHover,
        selected && styles.rowSelected,
        className,
      )}
      data-selected={selected ? "" : undefined}
      {...props}
    />
  );
}

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
  /** Tự bọc chuỗi bằng Typography header */
  label?: string;
}

export function TableHead({
  align = "left",
  label,
  children,
  className,
  ...props
}: TableHeadProps) {
  const content =
    label !== undefined ? (
      <Typography
        variant="xs"
        weight="semibold"
        color="muted"
        className={styles.headLabel}
      >
        {label}
      </Typography>
    ) : (
      children
    );

  return (
    <th align={align} className={cn(ALIGN_CLASS[align], className)} {...props}>
      {content}
    </th>
  );
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
}

export function TableCell({
  align = "left",
  className,
  ...props
}: TableCellProps) {
  return (
    <td align={align} className={cn(ALIGN_CLASS[align], className)} {...props} />
  );
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn(styles.caption, className)} {...props} />;
}

export interface TableEmptyProps extends React.HTMLAttributes<HTMLTableRowElement> {
  colSpan: number;
  message?: string;
}

/** Một dòng “không có dữ liệu” */
export function TableEmpty({
  colSpan,
  message = "No data",
  className,
  ...props
}: TableEmptyProps) {
  return (
    <TableRow className={className} {...props}>
      <TableCell colSpan={colSpan} align="center" className={styles.empty}>
        <Typography variant="small" color="muted">
          {message}
        </Typography>
      </TableCell>
    </TableRow>
  );
}
