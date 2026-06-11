"use client";

import { Button, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { OSS_GATEWAY_DEV_URL } from "@/lib/runtime/oss-gateway";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import sharedStyles from "../setup-shared.module.css";

interface SetupCreateFormProps {
  oss: boolean;
  busy: boolean;
  error: string | null;
  onCreate: () => void;
}

export function SetupCreateForm({ oss, busy, error, onCreate }: SetupCreateFormProps) {
  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge="Step 1 · One time"
        title="Get started"
        description={
          oss ? (
            <>
              We will create your workspace and verify the shared OpenClaw gateway at{" "}
              <strong>{OSS_GATEWAY_DEV_URL}</strong>. If the gateway is not running, you will stay
              on this page with steps to fix it before opening the dashboard.
            </>
          ) : (
            <>
              The backend will create your workspace and start an OpenClaw Docker container. If
              startup fails, you can retry from this page instead of landing on a broken dashboard.
            </>
          )
        }
      />
      <Flex direction="column" gap={16}>
        {error && (
          <Typography variant="small" className={sharedStyles.errorText}>
            {error}
          </Typography>
        )}
        <Button type="button" loading={busy} fullWidth onClick={onCreate}>
          {oss ? "Create workspace" : "Create & start container"}
        </Button>
      </Flex>
    </Flex>
  );
}
