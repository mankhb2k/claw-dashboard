import type { CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Flex } from "@/components/layout";
import { Card, Typography } from "@/components/ui";
import styles from "./MetricCard.module.css";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  color = "var(--color-primary)",
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card hover="md" className={styles.root}>
      <Flex justify="between" align="start">
        <Flex direction="column" gap={4}>
          <Typography variant="p" weight="medium">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="xs" color="muted">
              {subtitle}
            </Typography>
          ) : null}
        </Flex>

        <Flex align="center" gap={8}>
          <Typography variant="h3" weight="bold">
            {value}
          </Typography>
          {trend !== undefined ? (
            <Flex
              align="center"
              className={isPositive ? styles.trendUp : styles.trendDown}
              aria-hidden
            >
              {isPositive ? (
                <ArrowUpRight size={18} />
              ) : (
                <ArrowDownRight size={18} />
              )}
            </Flex>
          ) : null}
        </Flex>
      </Flex>

      <div
        className={styles.accentBar}
        style={{ "--metric-accent": color } as CSSProperties}
      />
    </Card>
  );
}
