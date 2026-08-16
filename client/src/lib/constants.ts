import type { Role, TicketPriority, TicketStatus } from '../types'

export const statusLabels: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
  CLOSED: 'Closed',
}

export const priorityLabels: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

export const roleLabels: Record<Role, string> = {
  EMPLOYEE: 'Employee',
  TECHNICIAN: 'Technician',
  ADMIN: 'Admin',
}

export const ticketStatuses = Object.keys(statusLabels) as TicketStatus[]
export const ticketPriorities = Object.keys(priorityLabels) as TicketPriority[]
export const roles = Object.keys(roleLabels) as Role[]