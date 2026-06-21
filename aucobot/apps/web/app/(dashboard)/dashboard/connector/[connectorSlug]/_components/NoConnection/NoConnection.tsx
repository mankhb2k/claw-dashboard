"use client";

import Image from "next/image";

import styles from "./NoConnection.module.css";
import { type ServiceConnectData } from "../../../projectConnectData";
import { BackButton } from "@/components/dashboard";
import { Container, Flex, Box } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { shouldUseUnoptimized } from "@/utils/image/app-image.utils";

interface Props {
  service: ServiceConnectData;
  isConnecting: boolean;
  onConnect: () => void;
}

export function NoConnection({ service, isConnecting, onConnect }: Props) {
  return (
    <div className={styles.page}>
      <Container size="md">
        <Box py={48}>
          <Flex direction="column" gap={32}>
            <BackButton href="/dashboard/connector">{service.name}</BackButton>

            <Flex
              direction="column"
              center
              gap={32}
              p={40}
              border
              radius="lg"
              color="surface"
              className={styles.notConnectedBorder}
            >
              <div className={styles.serviceIcon}>
                {service.iconSrc ? (
                  <Image
                    src={service.iconSrc}
                    alt={service.name}
                    width={56}
                    height={56}
                    unoptimized={shouldUseUnoptimized(service.iconSrc)}
                  />
                ) : (
                  <span className={styles.serviceIconFallback}>
                    {service.name.slice(0, 1)}
                  </span>
                )}
              </div>

              <Flex
                direction="column"
                center
                gap={12}
                className={styles.serviceIntro}
              >
                <Typography color="muted">{service.description}</Typography>
              </Flex>

              <Button size="lg" loading={isConnecting} onClick={onConnect}>
                Connect {service.name}
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Container>
    </div>
  );
}
