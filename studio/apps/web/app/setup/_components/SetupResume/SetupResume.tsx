"use client";

import sharedStyles from "../setup-shared.module.css";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { localizeSetupMessage, statusLabel } from "@/utils/setup/setup-i18n";

import type { Project } from "@/schemas/project.schema";

interface SetupResumeProps {
  primary: Project;
  busy: boolean;
  isLoading: boolean;
  error: string | null;
  onGoToDashboard: () => void;
  onRetryGateway?: () => void;
}

export function SetupResume({
  primary,
  busy,
  isLoading,
  error,
  onGoToDashboard,
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
            {statusLabel(status, false, true, t)}
          </>
        }
      />
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
            ? t("setup.resume.buttons.waitingGateway")
            : t("setup.resume.buttons.continueDashboard")}
        </Button>
        {onRetryGateway &&
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
