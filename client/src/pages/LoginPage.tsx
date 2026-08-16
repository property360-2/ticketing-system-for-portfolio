import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../features/auth/AuthContext'
import { getApiErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

interface LocationState {
  from?: { pathname?: string }
}

export default function LoginPage() {
  const { login, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (values: LoginForm) => {
    setError(null)
    try {
      await login(values.email, values.password)
      const from = (location.state as LocationState | null)?.from?.pathname
      navigate(from ?? '/dashboard', { replace: true })
    } catch (e) {
      setError(getApiErrorMessage(e))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-gray-800">HelpDesk</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          Seeded admin: admin@helpdesk.com / Admin@123
        </p>
      </Card>
    </div>
  )
}