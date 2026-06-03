"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { resolveDashboardPath } from "@/lib/resolve-dashboard-path";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
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
      router.push(await resolveDashboardPath());
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Đăng ký thất bại",
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Create account</h1>
      <p className={styles.subtitle}>Self-host · Register by username</p>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Input
          id="username"
          type="text"
          label="Username"
          placeholder="admin"
          autoComplete="username"
          error={errors.username?.message}
          {...register("username")}
        />

        <Input
          id="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          id="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
          Create account
        </Button>
      </form>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link href="/login" className={styles.link}>
          Login
        </Link>
      </p>
    </div>
  );
}
