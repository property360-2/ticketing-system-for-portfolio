export type Role = 'EMPLOYEE' | 'TECHNICIAN' | 'ADMIN'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED'

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ActivityAction =
  | 'TICKET_CREATED'
  | 'TICKET_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'COMMENT_ADDED'
  | 'ATTACHMENT_UPLOADED'
  | 'TICKET_RESOLVED'
  | 'TICKET_REOPENED'
  | 'TICKET_CLOSED'

export interface AuthResponse {
  token: string
  userId: string
  name: string
  email: string
  role: Role
  isActive: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  departmentId: number | null
  departmentName: string | null
  isActive: boolean
  createdAt: string
}

export interface Department {
  id: number
  name: string
  description: string | null
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Ticket {
  id: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdById: string
  createdByName: string
  assignedToId: string | null
  assignedToName: string | null
  categoryId: number
  categoryName: string
  departmentId: number
  departmentName: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  closedAt: string | null
  commentCount: number
  attachmentCount: number
}

export interface TicketComment {
  id: number
  content: string
  userId: string
  userName: string
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: number
  fileName: string
  fileSize: number
  mimeType: string
  uploadedById: string
  uploadedByName: string
  createdAt: string
}

export interface ActivityLog {
  id: number
  action: ActivityAction
  oldValue: string | null
  newValue: string | null
  userId: string
  userName: string
  createdAt: string
}

export interface DashboardSummary {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  critical: number
}

export interface CountByValue {
  value: string
  count: number
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface TicketQuery {
  status?: TicketStatus
  priority?: TicketPriority
  categoryId?: number
  departmentId?: number
  assignedToId?: string
  createdById?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface UserQuery {
  search?: string
  role?: Role
  departmentId?: number
  isActive?: boolean
  page?: number
  pageSize?: number
}

export interface ActivityLogQuery {
  userId?: string
  action?: ActivityAction
  ticketId?: number
  page?: number
  pageSize?: number
}
