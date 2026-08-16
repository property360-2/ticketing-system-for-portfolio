import apiClient from './axios'
import type { Department } from '../types'

export const departmentsApi = {
  getAll: () =>
    apiClient.get<Department[]>('/departments').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Department>(`/departments/${id}`).then((r) => r.data),

  create: (data: { name: string; description: string | null }) =>
    apiClient.post<Department>('/departments', data).then((r) => r.data),

  update: (id: number, data: { name: string; description: string | null }) =>
    apiClient.put<Department>(`/departments/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    apiClient.delete(`/departments/${id}`).then((r) => r.data),
}
