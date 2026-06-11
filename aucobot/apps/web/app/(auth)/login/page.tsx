"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { resolveDashboardPath } from "@/lib/routing/resolve-dashboard-path";
import { Input } from "@/components/ui/Input/Input";
import { Button } from "@/components/ui/Button/Button";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
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
      router.push(await resolveDashboardPath());
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Login failed",
      });
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Login</h1>
      <p className={styles.subtitle}>Username + Password</p>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        suppressHydrationWarning
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: "100%" }}>
          Login
        </Button>
      </form>

      <p className={styles.footer}>
        Don't have an account?{" "}
        <Link href="/register" className={styles.link}>
          Register
        </Link>
      </p>
    </div>
  );
}
