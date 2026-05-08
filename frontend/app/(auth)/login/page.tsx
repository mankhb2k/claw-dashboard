"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Separator from "@radix-ui/react-separator";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/lib/api/auth";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { SocialLoginButton } from "@/components/SocialLoginButton/SocialLoginButton";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setUser = useAuthStore((s) => s.setUser);
  const isLoading = useAuthStore((s) => s.isLoading);

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
      router.push("/dashboard");
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Đăng nhập thất bại",
      });
    }
  };

  const skipLoginForDesign = () => {
    document.cookie = "oc_preview_auth=1; path=/; max-age=86400";
    setUser({
      id: "preview-user",
      email: "demo@example.com",
      name: "Demo User",
      createdAt: new Date().toISOString(),
      image: null,
    });
    router.push("/dashboard");
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Đăng nhập</h1>
      <p className={styles.subtitle}>Chào mừng trở lại</p>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          id="password"
          type="password"
          label="Mật khẩu"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
          Đăng nhập
        </Button>
      </form>

      <div className={styles.divider}>
        <Separator.Root
          className={styles.dividerLine}
          decorative
          orientation="horizontal"
        />
        <span>hoặc</span>
        <Separator.Root
          className={styles.dividerLine}
          decorative
          orientation="horizontal"
        />
      </div>

      <div className={styles.socialLogin}>
        <SocialLoginButton
          provider="google"
          onClick={() => authApi.signInGoogle()}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        style={{ width: "100%" }}
        onClick={skipLoginForDesign}
      >
        Bỏ qua đăng nhập (Design mode)
      </Button>

      <p className={styles.footer}>
        Chưa có tài khoản?{" "}
        <Link href="/register" className={styles.link}>
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
