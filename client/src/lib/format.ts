import type { TicketPriority, TicketStatus } from '../types'
import type { BadgeTone } from '../components/ui/Badge'

export const statusTone: Record<TicketStatus, BadgeTone> = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  REOPENED: 'orange',
  CLOSED: 'gray',
}

export const priorityTone: Record<TicketPriority, BadgeTone> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  CRITICAL: 'red',
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '\u2014'
  return new Date(value).toLocaleString()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}