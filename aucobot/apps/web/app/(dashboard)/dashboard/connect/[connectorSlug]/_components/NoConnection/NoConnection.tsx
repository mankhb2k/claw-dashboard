"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button, Typography } from "@/components/ui";
import { Container, Flex, Box } from "@/components/layout";
import styles from "./no-connection.module.css";

interface Props {
  service: any;
  isConnecting: boolean;
  onConnect: () => void;
}

export function NoConnection({ service, isConnecting, onConnect }: Props) {
  return (
    <div className={styles.page}>
      <Container size="md">
        <Box py={48}>
          <Flex direction="column" gap={32}>
            {/* --- ĐIỀU HƯỚNG --- */}
            <nav>
              <Link
                href={`/dashboard/connect`}
                className={styles.backBtn}
              >
                <ChevronLeft size={16} /> Quay lại tất cả kết nối
              </Link>
            </nav>

            {/* --- HERO SECTION: GIỚI THIỆU & NÚT KẾT NỐI --- */}
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

                <Typography variant="h2" weight="bold">
                  {service.name}
                </Typography>
                <Typography color="muted">{service.description}</Typography>
              </Flex>

              <Button size="lg" loading={isConnecting} onClick={onConnect}>
                Kết nối {service.name}
              </Button>
            </Flex>
          </Flex>
        </Box>
      </Container>
    </div>
  );
}
