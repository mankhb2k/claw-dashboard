import React from 'react';
import { Typography } from '@/components/ui';
import { Flex } from '@/components/layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './OverviewChart.module.css';

interface OverviewChartProps {
  title: string;
  data: any[];
  color?: string;
}

export function OverviewChart({ title, data, color = 'var(--color-primary)' }: OverviewChartProps) {
  const chartId = title.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={styles.chartCard}>
      <Flex justify="between" align="center" className={styles.header}>
        <Typography variant="p" weight="bold">{title}</Typography>
        <Flex gap={12} className={styles.tabs}>
          <button className={styles.tab}>Day</button>
          <button className={`${styles.tab} ${styles.active}`}>Week</button>
          <button className={styles.tab}>Month</button>
        </Flex>
      </Flex>
      
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--color-background)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color-${chartId})`} 
              strokeWidth={3}
              animationDuration={1500}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
