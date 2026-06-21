"use client";

import styles from "./CardChannel.module.css";
import { Flex } from "@/components/layout/Flex/Flex";
import { Card } from "@/components/ui/Card/Card";
import { IconProvider } from "@/components/ui/IconProvider/IconProvider";
import { Typography } from "@/components/ui/Typography/Typography";

export interface CardChannelProps {
  title: string;
  status: string; // e.g. "Disconnected", "Connected"
  iconSrc?: string;
  iconLabel?: string;
}

export function CardChannel({
  title,
  status,
  iconSrc,
  iconLabel,
}: CardChannelProps) {
  const isConnected = status.toLowerCase() === "connected";

  return (
    <Card className={styles.card} hover="sm">
      <Flex align="center" gap={12}>
        {iconSrc ? (
          <IconProvider
            src={iconSrc}
            label={iconLabel ?? title}
            size="lg"
            shape="square"
            withBackground={true}
          />
        ) : (
          <div className={styles.iconFallback}>
            <span className="material-symbols-outlined">{iconLabel}</span>
          </div>
        )}
        <Flex direction="column" gap={0}>
          <Typography
            variant="p"
            weight="bold"
            as="h3"
            className={styles.title}
          >
            {title}
          </Typography>
          <span className={`${styles.status} ${isConnected ? styles.connected : ""}`}>
            {status}
          </span>
        </Flex>
      </Flex>
    </Card>
  );
}
