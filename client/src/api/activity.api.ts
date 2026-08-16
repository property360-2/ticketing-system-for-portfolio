import apiClient from './axios'
import type { ActivityLog, ActivityLogQuery, PagedResult } from '../types'

export const activityApi = {
  getForTicket: (ticketId: number) =>
    apiClient.get<ActivityLog[]>(`/tickets/${ticketId}/activity`).then((r) => r.data),

  getAll: (params: ActivityLogQuery) =>
    apiClient.get<PagedResult<ActivityLog>>('/activity-logs', { params }).then((r) => r.data),
}
