"use client";

import React from "react";
import { Activity, Info } from "lucide-react";
import { Flex } from "@/components/layout";
import { Typography, Card } from "@/components/ui";
import styles from "./CardHeartbeatOverview.module.css";

export function CardHeartbeatOverview() {
  return (
    <Card className={styles.card}>
      <Flex align="center" gap={8} className={styles.headerRow}>
        <Activity size={18} />
        <div>
          <Typography variant="p" weight="medium">
            Main agent heartbeat
          </Typography>
          <Typography variant="small" color="muted">
            Periodic check-in for the default <code>main</code> session. Not the
            same as scheduled cron jobs or API key tests.
          </Typography>
        </div>
      </Flex>

      <div className={styles.callout}>
        <Info size={16} />
        <Typography variant="small" color="muted">
          When nothing needs attention, OpenClaw replies <code>HEARTBEAT_OK</code>{" "}
          — that is normal and may appear in Chat history.
        </Typography>
      </div>
    </Card>
  );
}
