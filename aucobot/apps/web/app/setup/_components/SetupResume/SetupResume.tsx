"use client";

import sharedStyles from "../setup-shared.module.css";
import styles from "./SetupResume.module.css";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { localizeSetupMessage, statusLabel } from "@/utils/setup/setup-i18n";

import type { Project, ProjectStatus } from "@/schemas/project.schema";

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

function stepRowClass(
  status: ProjectStatus,
  activeStatus: ProjectStatus,
  doneWhen: ProjectStatus[],
) {
  if (status === activeStatus) return styles.stepActive;
  if (doneWhen.includes(status)) return styles.stepDone;
  return styles.stepIdle;
}

function dotClass(
  status: ProjectStatus,
  activeStatus: ProjectStatus,
  doneWhen: ProjectStatus[],
) {
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
  const { t } = useI18n();
  const { status } = primary;
  const localizedError = localizeSetupMessage(error, t);
  const localizedProjectError = localizeSetupMessage(
    primary.errorMessage,
    t,
  );

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge={t("setup.resume.badge")}
        title={t("setup.resume.title")}
        description={
          <>
            <strong>{primary.displayName}</strong> —{" "}
            {statusLabel(status, false, oss, t)}
          </>
        }
      />
      {!oss && (
        <Box color="subtle" p={16} radius="md">
          <Flex direction="column" gap={12}>
            <Flex align="start" gap={12}>
              <span
                className={`${styles.dot} ${dotClass(status, "creating", ["starting", "running"])}`}
              />
              <Typography
                variant="small"
                className={stepRowClass(status, "creating", [
                  "starting",
                  "running",
                ])}
              >
                {t("setup.resume.steps.docker")}
              </Typography>
            </Flex>
            <Flex align="start" gap={12}>
              <span
                className={`${styles.dot} ${dotClass(status, "starting", ["running"])}`}
              />
              <Typography
                variant="small"
                className={stepRowClass(status, "starting", ["running"])}
              >
                {t("setup.resume.steps.gateway")}
              </Typography>
            </Flex>
          </Flex>
        </Box>
      )}
      {localizedProjectError && (
        <Box color="danger-dim" p={12} radius="md">
          <Typography variant="xs" color="muted">
            {localizedProjectError}
          </Typography>
        </Box>
      )}
      {localizedError && (
        <Typography variant="small" className={sharedStyles.errorText}>
          {localizedError}
        </Typography>
      )}
      <Flex direction="column" gap={12}>
        <Button
          type="button"
          loading={busy || isLoading}
          fullWidth
          onClick={onGoToDashboard}
        >
          {busy
            ? oss
              ? t("setup.resume.buttons.waitingGateway")
              : t("setup.resume.buttons.waitingContainer")
            : oss
              ? t("setup.resume.buttons.continueDashboard")
              : t("setup.resume.buttons.startContainer")}
        </Button>
        {!oss && (status === "creating" || status === "starting") && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            fullWidth
            onClick={onRespawn}
          >
            {t("setup.resume.buttons.respawn")}
          </Button>
        )}
        {oss &&
          onRetryGateway &&
          (status === "creating" ||
            status === "starting" ||
            status === "error") && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              fullWidth
              onClick={onRetryGateway}
            >
              {t("setup.resume.buttons.checkGateway")}
            </Button>
          )}
      </Flex>
    </Flex>
  );
}
