import React from 'react';
import { Typography } from '@/components/ui';
import { Flex } from '@/components/layout';
import styles from './UsageTable.module.css';

interface UsageTableProps {
  title: string;
  data: any[];
}

export function UsageTable({ title, data }: UsageTableProps) {
  return (
    <div className={styles.tableCard}>
      <Flex justify="between" align="center" className={styles.header}>
        <Typography variant="p" weight="bold">{title}</Typography>
        <Flex gap={12} className={styles.tabs}>
          <button className={styles.tab}>Day</button>
          <button className={`${styles.tab} ${styles.active}`}>Week</button>
          <button className={styles.tab}>Month</button>
        </Flex>
      </Flex>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th align="left">Model / Task</th>
              <th align="left">User / Source</th>
              <th align="left">Status</th>
              <th align="right">Latency</th>
              <th align="right">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>
                  <Flex align="center" gap={12}>
                    <div className={styles.modelIcon} style={{ background: row.color }} />
                    <Flex direction="column">
                      <Typography variant="small" weight="medium">{row.model}</Typography>
                      <Typography variant="xs" color="muted">{row.time}</Typography>
                    </Flex>
                  </Flex>
                </td>
                <td>
                  <Typography variant="small">{row.user}</Typography>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[row.status.toLowerCase()]}`}>
                    {row.status}
                  </span>
                </td>
                <td align="right">
                  <Typography variant="small">{row.latency}ms</Typography>
                </td>
                <td align="right">
                  <Typography variant="small" weight="bold">
                    {row.tokens.toLocaleString('en-US')}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
