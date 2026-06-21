"use client";

import sharedStyles from "../setup-shared.module.css";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import { Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { OSS_GATEWAY_DEV_URL } from "@/lib/runtime/oss-gateway";
import { localizeSetupMessage } from "@/utils/setup/setup-i18n";

interface SetupCreateFormProps {
  oss: boolean;
  busy: boolean;
  error: string | null;
  onCreate: () => void;
}

export function SetupCreateForm({
  oss,
  busy,
  error,
  onCreate,
}: SetupCreateFormProps) {
  const { t } = useI18n();
  const localizedError = localizeSetupMessage(error, t);

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge={t("setup.create.badge")}
        title={t("setup.create.title")}
        description={
          oss ? (
            <>
              {t("setup.create.description.ossBefore")}{" "}
              <strong>{OSS_GATEWAY_DEV_URL}</strong>.{" "}
              {t("setup.create.description.ossAfter")}
            </>
          ) : (
            t("setup.create.description.cloud")
          )
        }
      />
      <Flex direction="column" gap={16}>
        {localizedError && (
          <Typography variant="small" className={sharedStyles.errorText}>
            {localizedError}
          </Typography>
        )}
        <Button type="button" loading={busy} fullWidth onClick={onCreate}>
          {oss ? t("setup.create.submit.oss") : t("setup.create.submit.cloud")}
        </Button>
      </Flex>
    </Flex>
  );
}
