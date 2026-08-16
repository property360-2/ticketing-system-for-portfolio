import apiClient from './axios'
import type { PagedResult, Ticket, TicketQuery } from '../types'

export const ticketsApi = {
  getAll: (params: TicketQuery) =>
    apiClient.get<PagedResult<Ticket>>('/tickets', { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Ticket>(`/tickets/${id}`).then((r) => r.data),

  create: (data: {
    title: string
    description: string
    priority: string
    categoryId: number
    departmentId: number
  }) => apiClient.post<Ticket>('/tickets', data).then((r) => r.data),

  update: (
    id: number,
    data: {
      title: string
      description: string
      priority: string
      categoryId: number
      departmentId: number
    },
  ) => apiClient.put<Ticket>(`/tickets/${id}`, data).then((r) => r.data),

  remove: (id: number) => apiClient.delete(`/tickets/${id}`).then((r) => r.data),

  assign: (id: number, assignedToId: string | null) =>
    apiClient.patch<Ticket>(`/tickets/${id}/assignment`, { assignedToId }).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/status`, { status }).then((r) => r.data),

  updatePriority: (id: number, priority: string) =>
    apiClient.patch<Ticket>(`/tickets/${id}/priority`, { priority }).then((r) => r.data),
}
