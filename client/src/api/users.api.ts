import apiClient from './axios'
import type { PagedResult, User, UserQuery } from '../types'

export const usersApi = {
  getAll: (params: UserQuery) =>
    apiClient.get<PagedResult<User>>('/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: { name: string; email: string; password: string; role: string; departmentId: number | null }) =>
    apiClient.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: { name: string; departmentId: number | null }) =>
    apiClient.put<User>(`/users/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/users/${id}`).then((r) => r.data),

  updateStatus: (id: string, isActive: boolean) =>
    apiClient.patch(`/users/${id}/status`, { isActive }).then((r) => r.data),

  updateRole: (id: string, role: string) =>
    apiClient.patch(`/users/${id}/role`, { role }).then((r) => r.data),

  updateDepartment: (id: string, departmentId: number | null) =>
    apiClient.patch(`/users/${id}/department`, { departmentId }).then((r) => r.data),
}
