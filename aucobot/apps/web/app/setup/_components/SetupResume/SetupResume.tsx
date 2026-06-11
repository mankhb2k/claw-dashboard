"use client";

import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import type { Project, ProjectStatus } from "@/schemas/project.schema";
import { statusLabel } from "@/utils/setup/setup-utils";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import sharedStyles from "../setup-shared.module.css";
import styles from "./SetupResume.module.css";

interface SetupResumeProps {
  primary: Project;
  oss: boolean;
  busy: boolean;
  isLoading: boolean;
  error: string | null;
  onGoToDashboard: () => void;
  onRespawn: () => void;
  onRetryGateway?: () => void;
}

function stepRowClass(status: ProjectStatus, activeStatus: ProjectStatus, doneWhen: ProjectStatus[]) {
  if (status === activeStatus) return styles.stepActive;
  if (doneWhen.includes(status)) return styles.stepDone;
  return styles.stepIdle;
}

function dotClass(status: ProjectStatus, activeStatus: ProjectStatus, doneWhen: ProjectStatus[]) {
  if (status === activeStatus) return styles.dotActive;
  if (doneWhen.includes(status)) return styles.dotDone;
  return "";
}

export function SetupResume({
  primary,
  oss,
  busy,
  isLoading,
  error,
  onGoToDashboard,
  onRespawn,
  onRetryGateway,
}: SetupResumeProps) {
  const { status } = primary;

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge="Preparing"
        title="Your workspace"
        description={
          <>
            <strong>{primary.displayName}</strong> — {statusLabel(status, false, oss)}
          </>
        }
      />
      {!oss && (
        <Box color="subtle" p={16} radius="md">
          <Flex direction="column" gap={12}>
            <Flex align="start" gap={12}>
              <span className={`${styles.dot} ${dotClass(status, "creating", ["starting", "running"])}`} />
              <Typography
                variant="small"
                className={stepRowClass(status, "creating", ["starting", "running"])}
              >
                Docker container
              </Typography>
            </Flex>
            <Flex align="start" gap={12}>
              <span className={`${styles.dot} ${dotClass(status, "starting", ["running"])}`} />
              <Typography
                variant="small"
                className={stepRowClass(status, "starting", ["running"])}
              >
                OpenClaw gateway
              </Typography>
            </Flex>
          </Flex>
        </Box>
      )}
      {primary.errorMessage && (
        <Box color="danger-dim" p={12} radius="md">
          <Typography variant="xs" color="muted">
            {primary.errorMessage}
          </Typography>
        </Box>
      )}
      {error && (
        <Typography variant="small" className={sharedStyles.errorText}>
          {error}
        </Typography>
      )}
      <Flex direction="column" gap={12}>
        <Button type="button" loading={busy || isLoading} fullWidth onClick={onGoToDashboard}>
          {busy
            ? oss
              ? "Waiting for gateway…"
              : "Waiting for container…"
            : oss
              ? "Continue to dashboard"
              : "Start container & open dashboard"}
        </Button>
        {!oss && (status === "creating" || status === "starting") && (
          <Button type="button" variant="ghost" disabled={busy} fullWidth onClick={onRespawn}>
            Respawn (if stuck over 1 min)
          </Button>
        )}
        {oss && onRetryGateway && (status === "creating" || status === "starting" || status === "error") && (
          <Button type="button" variant="ghost" disabled={busy} fullWidth onClick={onRetryGateway}>
            Check gateway again
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
