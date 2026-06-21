"use client";

import sharedStyles from "../setup-shared.module.css";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { localizeSetupMessage } from "@/utils/setup/setup-i18n";

import type { Project } from "@/schemas/project.schema";

interface SetupCloudRecreateProps {
  primary: Project;
  busy: boolean;
  isLoading: boolean;
  error: string | null;
  onRespawn: () => void;
}

export function SetupCloudRecreate({
  primary,
  busy,
  isLoading,
  error,
  onRespawn,
}: SetupCloudRecreateProps) {
  const { t } = useI18n();
  const isError = primary.status === "error";
  const localizedError = localizeSetupMessage(error, t);
  const localizedProjectError = localizeSetupMessage(
    primary.errorMessage,
    t,
  );

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge={
          isError
            ? t("setup.recreate.badge.spawnFailed")
            : t("setup.recreate.badge.containerMissing")
        }
        title={
          isError
            ? t("setup.recreate.title.respawn")
            : t("setup.recreate.title.recreate")
        }
        description={
          <>
            Workspace <strong>{primary.displayName}</strong>
            {isError
              ? ` ${t("setup.recreate.description.error")}`
              : ` ${t("setup.recreate.description.missing")}`}
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
      <Button type="button" loading={busy || isLoading} fullWidth onClick={onRespawn}>
        {busy ? t("setup.recreate.spawning") : t("setup.recreate.respawn")}
      </Button>
    </Flex>
  );
}
