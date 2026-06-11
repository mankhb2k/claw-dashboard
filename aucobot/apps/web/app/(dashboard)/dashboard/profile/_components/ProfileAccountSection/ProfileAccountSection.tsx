"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/stores/auth.store";
import {
  updateUserNameSchema,
  type PublicUser,
  type UpdateUserNameInput,
} from "@/schemas/user.schema";
import { CardSection } from "../../../setting/_components/CardSection/CardSection";
import { TitleSection } from "../../../setting/_components/TitleSection/TitleSection";
import styles from "../../profile.module.css";

interface ProfileAccountSectionProps {
  user: PublicUser;
  onUserUpdated: (user: PublicUser) => void;
}

export function ProfileAccountSection({
  user,
  onUserUpdated,
}: ProfileAccountSectionProps) {
  const setAuthUser = useAuthStore((s) => s.setUser);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const memberSince = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(user.createdAt),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<UpdateUserNameInput>({
    resolver: zodResolver(updateUserNameSchema),
    defaultValues: { name: user.name },
  });

  const onSubmit = async (data: UpdateUserNameInput) => {
    setSaveStatus("saving");
    try {
      const updated = await usersApi.updateName(data);
      onUserUpdated(updated);
      setAuthUser({
        id: updated.id,
        username: updated.username,
        name: updated.name,
        avatarUrl: updated.avatarUrl,
        createdAt: updated.createdAt,
      });
      reset(data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection
        title="Account"
        description="Your sign-in identity and display name across the dashboard."
      />

      <CardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Display name
              </Typography>
              <Typography variant="small" color="muted">
                Shown in the sidebar and profile header.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="profile-display-name"
                error={errors.name?.message}
                {...register("name")}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow} noBorder>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Username
              </Typography>
              <Typography variant="small" color="muted">
                Used to sign in. Cannot be changed.
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <p className={styles.readOnlyValue}>@{user.username}</p>
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow} noBorder>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Member since
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <p className={styles.readOnlyValue}>{memberSince}</p>
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Footer>
            <div className={styles.footerActions}>
              {saveStatus === "saved" && (
                <span className={styles.statusOk}>Saved</span>
              )}
              {saveStatus === "error" && (
                <span className={styles.statusError}>Could not save</span>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!isDirty || saveStatus === "saving"}
                loading={saveStatus === "saving"}
              >
                Save changes
              </Button>
            </div>
          </CardSection.Footer>
        </form>
      </CardSection>
    </Flex>
  );
}
