"use client";

import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { isProjectReady } from "@/lib/routing/entry-route";
import {
  SETUP_ERROR_KEYS,
  statusLabel,
} from "@/utils/setup/setup-i18n";

import type { Project } from "@/schemas/project.schema";

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
  const { t } = useI18n();
  const gatewayReady = isProjectReady(primary.status);
  const status = statusLabel(primary.status, false, true, t);

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge={t("setup.recover.badge")}
        title={t("setup.recover.title")}
        description={t("setup.recover.description", { status })}
      />
      {!gatewayReady && (
        <Box color="danger-dim" p={12} radius="md">
          <Typography variant="xs" color="muted">
            <strong>{t("setup.recover.errorLabel")}</strong>{" "}
            {t(SETUP_ERROR_KEYS.gatewayUnreachable)}
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
        {busy
          ? t("setup.recover.checkingGateway")
          : t("setup.recover.continueDashboard")}
      </Button>
      {!gatewayReady && (
        <Button
          type="button"
          variant="ghost"
          disabled={busy || isLoading}
          fullWidth
          onClick={onCheckGateway}
        >
          {t("setup.recover.checkGateway")}
        </Button>
      )}
    </Flex>
  );
}
