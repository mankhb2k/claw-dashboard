"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Typography } from "@/components/ui";
import { Flex } from "@/components/layout";
import { usersApi } from "@/lib/api/users";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/schemas/user.schema";
import { CardSection } from "../../../setting/_components/CardSection/CardSection";
import { TitleSection } from "../../../setting/_components/TitleSection/TitleSection";
import styles from "../../profile.module.css";

export function ProfileSecuritySection() {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setSaveStatus("saving");
    try {
      await usersApi.changePassword(data);
      reset();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <TitleSection
        title="Security"
        description="Update your password. You will stay signed in on this device."
      />

      <CardSection>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Current password
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="profile-current-password"
                type="password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow}>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                New password
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="profile-new-password"
                type="password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Row className={styles.cardRow} noBorder>
            <CardSection.Info className={styles.rowInfo}>
              <Typography variant="p" weight="medium">
                Confirm new password
              </Typography>
            </CardSection.Info>
            <CardSection.Action className={styles.rowAction}>
              <Input
                id="profile-confirm-password"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </CardSection.Action>
          </CardSection.Row>

          <CardSection.Footer>
            <div className={styles.footerActions}>
              {saveStatus === "saved" && (
                <span className={styles.statusOk}>Password updated</span>
              )}
              {saveStatus === "error" && (
                <span className={styles.statusError}>
                  Could not update — check current password
                </span>
              )}
              <Button
                type="submit"
                size="sm"
                loading={saveStatus === "saving"}
              >
                Update password
              </Button>
            </div>
          </CardSection.Footer>
        </form>
      </CardSection>
    </Flex>
  );
}
