"use client";

import type { CSSProperties } from "react";
import { Box, Flex } from "@/components/layout";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  ToggleGroup,
  ToggleGroupItem,
  Typography,
} from "@/components/ui";
import styles from "./UsageTable.module.css";

export type UsageTableRowStatus = "Success" | "Failed" | "Processing";

export interface UsageTableRow {
  model: string;
  time: string;
  user: string;
  status: UsageTableRowStatus | string;
  latency: number;
  tokens: number;
  color: string;
}

interface UsageTableProps {
  title: string;
  data: UsageTableRow[];
}

const PERIOD_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

const TABLE_COLUMNS = [
  { key: "model", label: "Model / Task", align: "left" as const },
  { key: "user", label: "User / Source", align: "left" as const },
  { key: "status", label: "Status", align: "left" as const },
  { key: "latency", label: "Latency", align: "right" as const },
  { key: "tokens", label: "Tokens", align: "right" as const },
];

const COLUMN_COUNT = TABLE_COLUMNS.length;

function statusBadgeClass(status: string): string {
  const key = status.toLowerCase();
  if (key === "success") return styles.success;
  if (key === "failed") return styles.failed;
  return styles.processing;
}

export function UsageTable({ title, data }: UsageTableProps) {
  return (
    <Card hover="md">
      <Flex justify="between" align="center" className={styles.header}>
        <Typography variant="p" weight="bold">
          {title}
        </Typography>
        <ToggleGroup type="single" size="sm" defaultValue="week">
          {PERIOD_OPTIONS.map((period) => (
            <ToggleGroupItem key={period.value} value={period.value}>
              {period.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Flex>

      <Table scrollable>
        <TableHeader>
          <TableRow>
            {TABLE_COLUMNS.map((col) => (
              <TableHead key={col.key} label={col.label} align={col.align} />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableEmpty colSpan={COLUMN_COUNT} message="No recent calls" />
          ) : (
            data.map((row, idx) => (
              <TableRow
                key={`${row.model}-${row.time}-${idx}`}
                hoverable
              >
                <TableCell>
                  <Flex align="center" gap={12}>
                    <Box
                      className={styles.modelIcon}
                      style={
                        { "--row-accent": row.color } as CSSProperties
                      }
                      aria-hidden
                    />
                    <Flex direction="column" gap={2}>
                      <Typography variant="small" weight="medium">
                        {row.model}
                      </Typography>
                      <Typography variant="xs" color="muted">
                        {row.time}
                      </Typography>
                    </Flex>
                  </Flex>
                </TableCell>
                <TableCell>
                  <Typography variant="small">{row.user}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="xs"
                    weight="bold"
                    as="span"
                    className={`${styles.badge} ${statusBadgeClass(row.status)}`}
                  >
                    {row.status}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="small">{row.latency}ms</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="small" weight="bold">
                    {row.tokens.toLocaleString("en-US")}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
