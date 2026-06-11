"use client";

import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { isProjectReady } from "@/lib/routing/entry-route";
import type { Project } from "@/schemas/project.schema";
import { OSS_GATEWAY_ERROR_BODY, statusLabel } from "@/utils/setup/setup-utils";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";

interface SetupOssRecoverProps {
  primary: Project;
  busy: boolean;
  isLoading: boolean;
  onContinue: () => void;
  onCheckGateway: () => void;
}

export function SetupOssRecover({
  primary,
  busy,
  isLoading,
  onContinue,
  onCheckGateway,
}: SetupOssRecoverProps) {
  const gatewayReady = isProjectReady(primary.status);

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge="OSS · Shared gateway"
        title="Gateway check required"
        description={
          <>
            Your workspace is saved ({statusLabel(primary.status, false, true)}). Start the
            OpenClaw gateway on port <strong>18789</strong>, then continue to the dashboard.
          </>
        }
      />
      {!gatewayReady && (
        <Box color="danger-dim" p={12} radius="md">
          <Typography variant="xs" color="muted">
            <strong>Error:</strong> {OSS_GATEWAY_ERROR_BODY}
          </Typography>
        </Box>
      )}
      <Button
        type="button"
        loading={busy || isLoading}
        disabled={!gatewayReady}
        fullWidth
        onClick={onContinue}
      >
        {busy ? "Checking gateway…" : "Continue to dashboard"}
      </Button>
      {!gatewayReady && (
        <Button
          type="button"
          variant="ghost"
          disabled={busy || isLoading}
          fullWidth
          onClick={onCheckGateway}
        >
          Check gateway again
        </Button>
      )}
    </Flex>
  );
}
