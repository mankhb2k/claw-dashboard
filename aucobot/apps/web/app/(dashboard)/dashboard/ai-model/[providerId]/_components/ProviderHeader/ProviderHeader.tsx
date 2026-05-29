"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { type CSSProperties } from "react";
import { Button, IconProvider, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import styles from "./ProviderHeader.module.css";

interface ProviderHeaderProps {
  name: string;
  iconSrc?: string;
  color?: string;
  apiKeyUrl?: string;
  apiKeyLabel?: string;
  backHref?: string;
}

export function ProviderHeader({
  name,
  iconSrc,
  color,
  apiKeyUrl,
  apiKeyLabel = "Get API key",
  backHref = "/dashboard/ai-model",
}: ProviderHeaderProps) {
  return (
    <>
      <Button variant="link" size="sm" asChild className={styles.back}>
        <Link href={backHref}>
          <ChevronLeft size={16} />
          Back to list
        </Link>
      </Button>

      <Flex align="center" gap={16} className={styles.row}>
        <IconProvider
          src={iconSrc}
          label={name}
          size="xl"
          shape="square"
          withBackground
          style={
            color
              ? ({
                  "--icon-bg": `${color}18`,
                  color,
                } as CSSProperties)
              : undefined
          }
        />
        <Flex direction="column" gap={4} className={styles.meta}>
          <Typography variant="h2" weight="bold">
            {name}
          </Typography>
          <Flex align="center" gap={6} wrap="wrap" className={styles.subtitle}>
            <Typography variant="small" color="muted">
              Manage API key
            </Typography>
            {apiKeyUrl ? (
              <>
                <Typography variant="small" color="muted" as="span">
                  ·
                </Typography>
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className={styles.apiKeyLink}
                >
                  <a href={apiKeyUrl} target="_blank" rel="noopener noreferrer">
                    {apiKeyLabel}
                    <ArrowUpRight size={10} aria-hidden />
                  </a>
                </Button>
              </>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
