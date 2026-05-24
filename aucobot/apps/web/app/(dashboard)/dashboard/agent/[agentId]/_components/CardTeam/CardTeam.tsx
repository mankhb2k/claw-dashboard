"use client";

import React from "react";
import { Flex } from "@/components/layout";
import { Typography, Switch } from "@/components/ui";
import { Bot } from "lucide-react";
import styles from "./CardTeam.module.css";

export function CardTeam() {
  return (
    <div className={styles.section}>
      <Flex justify="between" align="center" style={{ marginBottom: 16 }}>
        <div>
          <Typography variant="p" weight="bold">Cho phép gọi Agent khác (Sub-agents)</Typography>
          <Typography variant="small" color="muted">Kích hoạt để Agent này có thể phân việc cho các Agent khác trong dự án.</Typography>
        </div>
        <Switch checked={true} onCheckedChange={() => {}} />
      </Flex>

      <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: 8 }}>
        <Typography variant="small" weight="medium" style={{ marginBottom: 12, display: "block" }}>
          Các Agent có thể gọi:
        </Typography>
        
        <Flex align="center" justify="between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
          <Flex align="center" gap={2}>
            <Bot size={16} /> <Typography variant="p">Data Analyst</Typography>
          </Flex>
          <input type="checkbox" defaultChecked />
        </Flex>
        
        <Flex align="center" justify="between" style={{ padding: "8px 0" }}>
          <Flex align="center" gap={2}>
            <Bot size={16} /> <Typography variant="p">Tech Support</Typography>
          </Flex>
          <input type="checkbox" />
        </Flex>
      </div>
    </div>
  );
}
