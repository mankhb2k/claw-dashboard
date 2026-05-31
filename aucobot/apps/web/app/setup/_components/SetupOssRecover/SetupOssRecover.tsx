"use client";

import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import type { Project } from "@/schemas/project.schema";
import { statusLabel } from "../setup-utils";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";

interface SetupOssRecoverProps {
  primary: Project;
  busy: boolean;
  isLoading: boolean;
  error: string | null;
  onContinue: () => void;
  onRetryGateway?: () => void;
}

export function SetupOssRecover({
  primary,
  busy,
  isLoading,
  error,
  onContinue,
  onRetryGateway,
}: SetupOssRecoverProps) {
  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge="OSS · Shared gateway"
        title="Continue to dashboard"
        description={
          <>
            Workspace <strong>{primary.displayName}</strong> —{" "}
            {statusLabel(primary.status, false, true)}. Ensure the gateway container is running on
            port <strong>18789</strong>, then continue.
          </>
        }
      />
      {primary.errorMessage && (
        <Box color="danger-dim" p={12} radius="md">
          <Typography variant="xs" color="muted">
            {primary.errorMessage}
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="small" style={{ color: "var(--color-danger)" }}>
          {error}
        </Typography>
      )}
      <Button type="button" loading={busy || isLoading} fullWidth onClick={onContinue}>
        {busy ? "Checking gateway…" : "Continue to dashboard"}
      </Button>
      {onRetryGateway && (
        <Button type="button" variant="ghost" disabled={busy} fullWidth onClick={onRetryGateway}>
          Check gateway again
        </Button>
      )}
    </Flex>
  );
}
