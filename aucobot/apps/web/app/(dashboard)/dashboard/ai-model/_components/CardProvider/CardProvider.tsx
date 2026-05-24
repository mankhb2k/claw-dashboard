"use client";

import React from "react";
import { Card } from "@/components/ui/Card/Card";
import { IconProvider } from "@/components/ui/IconProvider/IconProvider";
import { Flex } from "@/components/layout/Flex/Flex";
import { Typography } from "@/components/ui/Typography/Typography";
import styles from "./CardProvider.module.css";

export interface CardProviderProps {
  title: string;
  status: string;
  ready?: boolean;
  iconSrc?: string;
  iconLabel?: string;
}

export function CardProvider({
  title,
  status,
  ready,
  iconSrc,
  iconLabel,
}: CardProviderProps) {
  const isReady = ready === true;

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
        <Flex direction="column" gap={0} className={styles.textCol}>
          <Typography
            variant="p"
            weight="bold"
            as="h3"
            className={styles.title}
          >
            {title}
          </Typography>
          <span className={`${styles.status} ${isReady ? styles.ready : ""}`}>
            {status}
          </span>
        </Flex>
      </Flex>
    </Card>
  );
}
