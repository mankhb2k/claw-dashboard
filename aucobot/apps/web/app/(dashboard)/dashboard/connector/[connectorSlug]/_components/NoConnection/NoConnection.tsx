"use client";

import { Button, Typography } from "@/components/ui";
import { Container, Flex, Box } from "@/components/layout";
import { BackButton } from "@/components/dashboard";
import { type ServiceConnectData } from "../../../projectConnectData";
import styles from "./NoConnection.module.css";

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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={service.iconSrc} alt={service.name} />
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
