"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import styles from "./register.module.css";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { useI18n } from "@/lib/i18n";
import { resolveDashboardPath } from "@/lib/routing/resolve-dashboard-path";
import { createRegisterSchema, type RegisterInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const register_ = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await register_(data);
      router.push(await resolveDashboardPath());
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("auth.register.failed"),
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t("auth.register.title")}</h1>
      <p className={styles.subtitle}>{t("auth.register.subtitle")}</p>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Input
          id="username"
          type="text"
          label={t("auth.fields.username.label")}
          placeholder={t("auth.fields.username.placeholder")}
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />

        <Input
          id="password"
          type="password"
          label={t("auth.fields.password.label")}
          placeholder={t("auth.fields.password.placeholder")}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          id="confirmPassword"
          type="password"
          label={t("auth.fields.confirmPassword.label")}
          placeholder={t("auth.fields.confirmPassword.placeholder")}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
          {t("auth.register.submit")}
        </Button>
      </form>

      <p className={styles.footer}>
        {t("auth.register.hasAccount")}{" "}
        <Link href="/login" className={styles.link}>
          {t("auth.register.loginLink")}
        </Link>
      </p>
    </div>
  );
}
