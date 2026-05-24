import React from 'react';
import { Typography } from '@/components/ui';
import { Flex } from '@/components/layout';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number; // Tỷ lệ %
    label: string; // VD: "so với tuần trước"
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;
  
  return (
    <div className={styles.card}>
      <Flex direction="column" gap={12}>
        <Flex justify="between" align="center">
          <Typography variant="small" color="muted" weight="medium">{title}</Typography>
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
        </Flex>
        
        <Flex direction="column" gap={4}>
          <Typography variant="h2" weight="bold">{value}</Typography>
          
          {trend && (
            <Flex align="center" gap={6}>
              <span className={isPositive ? styles.trendUp : styles.trendDown}>
                <Typography variant="xs" weight="bold">
                  {isPositive ? '+' : ''}{trend.value}%
                </Typography>
              </span>
              <Typography variant="xs" color="muted">{trend.label}</Typography>
            </Flex>
          )}
        </Flex>
      </Flex>
    </div>
  );
}
