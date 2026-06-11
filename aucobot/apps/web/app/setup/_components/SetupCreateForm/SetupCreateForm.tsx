"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { OSS_GATEWAY_DEV_URL } from "@/lib/runtime/oss-gateway";
import { setupFormSchema, type SetupFormInput } from "@/schemas/setup.schema";
import { SetupSectionHeader } from "../SetupSectionHeader/SetupSectionHeader";

interface SetupCreateFormProps {
  oss: boolean;
  busy: boolean;
  error: string | null;
  defaultDisplayName: string;
  onCreate: (data: SetupFormInput) => void;
}

export function SetupCreateForm({
  oss,
  busy,
  error,
  defaultDisplayName,
  onCreate,
}: SetupCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormInput>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: {
      displayName: defaultDisplayName,
    },
  });

  return (
    <Flex direction="column" gap={24}>
      <SetupSectionHeader
        badge="Step 1 · One time"
        title="Create workspace"
        description={
          oss ? (
            <>
              The API will save your workspace and verify the shared OpenClaw gateway at{" "}
              <strong>{OSS_GATEWAY_DEV_URL}</strong>. No per-project Docker container is created.
            </>
          ) : (
            <>
              The backend will create a project and spawn an OpenClaw Docker container. Next time
              use <strong>Open dashboard</strong> to start it again.
            </>
          )
        }
      />
      <form onSubmit={handleSubmit(onCreate)} noValidate>
        <Flex direction="column" gap={16}>
          <Input
            id="displayName"
            label="Workspace name"
            placeholder="e.g. Admin"
            error={errors.displayName?.message}
            disabled={busy}
            {...register("displayName")}
          />
          {error && (
            <Typography variant="small" style={{ color: "var(--color-danger)" }}>
              {error}
            </Typography>
          )}
          <Button type="submit" loading={busy} fullWidth>
            {oss ? "Create workspace" : "Create & start container"}
          </Button>
        </Flex>
      </form>
    </Flex>
  );
}
