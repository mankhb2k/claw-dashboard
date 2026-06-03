"use client";

import { useId, useMemo } from "react";
import type { TooltipProps } from "recharts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Box, Flex } from "@/components/layout";
import {
  Card,
  ToggleGroup,
  ToggleGroupItem,
  Typography,
} from "@/components/ui";
import styles from "./OverviewChart.module.css";

export interface OverviewChartDataPoint {
  name: string;
  value: number;
}

interface OverviewChartProps {
  title: string;
  data: OverviewChartDataPoint[];
  color?: string;
}

const PERIOD_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
] as const;

const CHART_HEIGHT_PX = 300;

function ChartTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <Box border radius="md" color="white" className={styles.tooltip}>
      <Flex direction="column" gap={4}>
        <Typography variant="xs" color="muted">
          {label}
        </Typography>
        <Typography variant="xs" weight="bold">
          {payload[0]?.value}
        </Typography>
      </Flex>
    </Box>
  );
}

export function OverviewChart({
  title,
  data,
  color = "var(--color-primary)",
}: OverviewChartProps) {
  const reactId = useId();
  const gradientId = useMemo(
    () => `overview-chart-${reactId.replace(/:/g, "")}`,
    [reactId],
  );

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

      <Box fullWidth className={styles.chartWrapper}>
        <ResponsiveContainer
          width="100%"
          height={CHART_HEIGHT_PX}
          minHeight={CHART_HEIGHT_PX}
        >
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={3}
              animationDuration={1500}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
