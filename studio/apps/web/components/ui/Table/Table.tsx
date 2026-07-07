import * as React from "react";

import styles from "./Table.module.css";
import { Typography } from "../Typography/Typography";

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
  /** Enable horizontal scroll when the table is wide */
  scrollable?: boolean;
  /** Cell padding density */
  size?: TableSize;
}

/** Table wrapper + `<table>` — use with Header / Body / Row / Head / Cell */
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
  /** Highlight on hover */
  hoverable?: boolean;
  /** Currently selected row */
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
  /** Wrap string content with Typography header styling */
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

/** Single "no data" row */
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
