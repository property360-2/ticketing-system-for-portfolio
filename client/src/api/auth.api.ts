import apiClient from './axios'
import type { AuthResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/register', { name, email, password }).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  updateProfile: (name: string) =>
    apiClient.put('/auth/me', { name }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/me/password', { currentPassword, newPassword }).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
}
