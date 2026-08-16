import apiClient from './axios'
import type { Category } from '../types'

export const categoriesApi = {
  getAll: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (data: { name: string; description: string | null }) =>
    apiClient.post<Category>('/categories', data).then((r) => r.data),

  update: (id: number, data: { name: string; description: string | null }) =>
    apiClient.put<Category>(`/categories/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    apiClient.delete(`/categories/${id}`).then((r) => r.data),
}
