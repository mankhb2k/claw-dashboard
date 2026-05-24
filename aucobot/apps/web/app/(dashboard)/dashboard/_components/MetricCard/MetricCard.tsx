import React from 'react';
import { Typography } from '@/components/ui';
import { Flex } from '@/components/layout';
import styles from './MetricCard.module.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  color?: string;
}

export function MetricCard({ title, value, subtitle, trend, color = 'var(--color-primary)' }: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className={styles.card}>
      <Flex justify="between" align="start">
        <Flex direction="column" gap={4}>
          <Typography variant="p" weight="medium">{title}</Typography>
          <Typography variant="xs" color="muted">{subtitle}</Typography>
        </Flex>
        
        <Flex align="center" gap={8}>
          <Typography variant="h3" weight="bold">{value}</Typography>
          {trend !== undefined && (
            <span className={isPositive ? styles.trendUp : styles.trendDown}>
              {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            </span>
          )}
        </Flex>
      </Flex>
      
      {/* Thanh màu trang trí ở dưới */}
      <div className={styles.progressBar} style={{ backgroundColor: color }} />
    </div>
  );
}
