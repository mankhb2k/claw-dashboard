"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Separator from "@radix-ui/react-separator";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/lib/api/auth";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import { SocialLoginButton } from "@/components/SocialLoginButton/SocialLoginButton";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const register_ = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

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
      router.push("/dashboard");
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Đăng ký thất bại",
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Tạo tài khoản</h1>
      <p className={styles.subtitle}>Miễn phí · Không cần thẻ</p>

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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          id="confirmPassword"
          type="password"
          label="Xác nhận mật khẩu"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
          Tạo tài khoản
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

      <p className={styles.footer}>
        Đã có tài khoản?{" "}
        <Link href="/login" className={styles.link}>
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
