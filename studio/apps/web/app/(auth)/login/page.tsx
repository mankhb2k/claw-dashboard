"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import styles from "./login.module.css";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { useI18n } from "@/lib/i18n";
import { resolveDashboardPath } from "@/lib/routing/resolve-dashboard-path";
import { createLoginSchema, type LoginInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const sessionExpired = searchParams.get("session") === "expired";

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      router.push(await resolveDashboardPath());
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : t("auth.login.failed"),
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t("auth.login.title")}</h1>
      <p className={styles.subtitle}>{t("auth.login.subtitle")}</p>

      {sessionExpired && (
        <p className={styles.rootError}>{t("auth.login.sessionExpired")}</p>
      )}

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        suppressHydrationWarning
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
          {t("auth.login.submit")}
        </Button>
      </form>

      <p className={styles.footer}>
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className={styles.link}>
          {t("auth.login.registerLink")}
        </Link>
      </p>
    </div>
  );
}
