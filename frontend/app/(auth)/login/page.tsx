'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api/auth'
import { Input } from '@/components/ui/Input/Input'
import { Button } from '@/components/ui/Button/Button'
import { SocialLoginButton } from '@/components/ui/SocialLoginButton/SocialLoginButton'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data)
      router.push('/dashboard')
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Đăng nhập thất bại',
      })
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Đăng nhập</h1>
      <p className={styles.subtitle}>Chào mừng trở lại</p>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="password"
          type="password"
          label="Mật khẩu"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {errors.root && (
          <p className={styles.rootError}>{errors.root.message}</p>
        )}

        <Button type="submit" loading={isLoading} style={{ width: '100%' }}>
          Đăng nhập
        </Button>
      </form>

      <div className={styles.divider}>
        <span>hoặc</span>
      </div>

      <div className={styles.socialLogin}>
        <SocialLoginButton provider="google" onClick={() => authApi.signInGoogle()} />
      </div>

      <p className={styles.footer}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className={styles.link}>
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
