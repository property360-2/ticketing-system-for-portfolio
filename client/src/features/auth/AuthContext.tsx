import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../../api/auth.api'
import type { User } from '../../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'))
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem('accessToken')
      if (!stored) {
        setIsLoading(false)
        return
      }
      try {
        const me = await authApi.me()
        setUser(me)
      } catch {
        localStorage.removeItem('accessToken')
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    void restore()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    localStorage.setItem('accessToken', response.token)
    setToken(response.token)
    const me = await authApi.me()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // token cleanup happens regardless
    }
    localStorage.removeItem('accessToken')
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await authApi.me()
    setUser(me)
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, refreshUser }),
    [user, token, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}