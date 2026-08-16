import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../../types'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user, token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner />
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}