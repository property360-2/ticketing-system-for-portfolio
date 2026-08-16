import apiClient, { API_BASE_URL } from './axios'
import type { Attachment } from '../types'

export const attachmentsApi = {
  getAll: (ticketId: number) =>
    apiClient.get<Attachment[]>(`/tickets/${ticketId}/attachments`).then((r) => r.data),

  upload: (ticketId: number, files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file))
    return apiClient
      .post<Attachment[]>(`/tickets/${ticketId}/attachments`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  downloadUrl: (ticketId: number, attachmentId: number) =>
    `${API_BASE_URL}/tickets/${ticketId}/attachments/${attachmentId}/download`,

  remove: (ticketId: number, attachmentId: number) =>
    apiClient.delete(`/tickets/${ticketId}/attachments/${attachmentId}`).then((r) => r.data),
}
