import { ArrowDownRight, ArrowUpRight } from "lucide-react";


import styles from "./CardMetric.module.css";
import { Flex } from "@/components/layout";
import { Card, Typography } from "@/components/ui";

import type { CSSProperties } from "react";

interface CardMetricProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
}

export function CardMetric({
  title,
  value,
  subtitle,
  trend,
  color = "var(--color-primary)",
}: CardMetricProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div style={{ "--metric-accent": color } as CSSProperties}>
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

        <div className={styles.accentBar} aria-hidden />
      </Card>
    </div>
  );
}
