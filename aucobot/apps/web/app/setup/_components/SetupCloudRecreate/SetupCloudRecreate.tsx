"use client";

import { Box, Flex } from "@/components/layout";
import { Button, Typography } from "@/components/ui";
import type { Project } from "@/schemas/project.schema";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";
import sharedStyles from "../setup-shared.module.css";

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
  const isError = primary.status === "error";

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge={isError ? "Spawn failed" : "Container missing"}
        title={isError ? "Respawn container" : "Recreate container"}
        description={
          <>
            Workspace <strong>{primary.displayName}</strong>
            {isError
              ? " — gateway was not ready in time or Docker failed. Respawn to create a new container."
              : " — data is kept on disk, but the Docker container is gone."}
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
        <Typography variant="small" className={sharedStyles.errorText}>
          {error}
        </Typography>
      )}
      <Button type="button" loading={busy || isLoading} fullWidth onClick={onRespawn}>
        {busy ? "Spawning…" : "Respawn container"}
      </Button>
    </Flex>
  );
}
