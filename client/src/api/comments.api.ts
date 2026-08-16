import apiClient from './axios'
import type { TicketComment } from '../types'

export const commentsApi = {
  getAll: (ticketId: number) =>
    apiClient.get<TicketComment[]>(`/tickets/${ticketId}/comments`).then((r) => r.data),

  create: (ticketId: number, content: string) =>
    apiClient.post<TicketComment>(`/tickets/${ticketId}/comments`, { content }).then((r) => r.data),

  update: (ticketId: number, commentId: number, content: string) =>
    apiClient.put<TicketComment>(`/tickets/${ticketId}/comments/${commentId}`, { content }).then((r) => r.data),

  remove: (ticketId: number, commentId: number) =>
    apiClient.delete(`/tickets/${ticketId}/comments/${commentId}`).then((r) => r.data),
}
