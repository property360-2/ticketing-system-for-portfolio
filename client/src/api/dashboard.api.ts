import apiClient from './axios'
import type { CountByValue, DashboardSummary } from '../types'

export const dashboardApi = {
  summary: () =>
    apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),

  ticketsByStatus: () =>
    apiClient.get<CountByValue[]>('/dashboard/tickets-by-status').then((r) => r.data),

  ticketsByPriority: () =>
    apiClient.get<CountByValue[]>('/dashboard/tickets-by-priority').then((r) => r.data),

  ticketsByCategory: () =>
    apiClient.get<CountByValue[]>('/dashboard/tickets-by-category').then((r) => r.data),

  ticketsByDepartment: () =>
    apiClient.get<CountByValue[]>('/dashboard/tickets-by-department').then((r) => r.data),
}
