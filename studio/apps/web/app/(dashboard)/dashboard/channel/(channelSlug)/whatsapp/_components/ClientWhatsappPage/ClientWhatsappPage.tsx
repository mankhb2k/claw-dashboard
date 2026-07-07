"use client";

import { BackButton } from "@/components/dashboard";
import { Flex } from "@/components/layout";
import { Typography } from "@/components/ui";

export function ClientWhatsappPage() {
  return (
    <Flex direction="column" gap={4}>
      <BackButton href="/dashboard/channel">WhatsApp</BackButton>
      <Typography variant="p" color="muted">
        This channel is not supported in the current OSS build. Use Telegram or check back in a
        future release.
      </Typography>
    </Flex>
  );
}
