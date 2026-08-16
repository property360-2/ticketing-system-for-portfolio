import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../features/auth/AuthContext'
import { queryClient } from './queryClient'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}