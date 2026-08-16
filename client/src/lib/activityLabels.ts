import type { ActivityAction } from '../types'

export const activityActionLabels: Record<ActivityAction, string> = {
  TICKET_CREATED: 'created ticket',
  TICKET_ASSIGNED: 'assigned ticket',
  STATUS_CHANGED: 'changed status',
  PRIORITY_CHANGED: 'changed priority',
  COMMENT_ADDED: 'commented',
  ATTACHMENT_UPLOADED: 'uploaded attachment',
  TICKET_RESOLVED: 'resolved ticket',
  TICKET_REOPENED: 'reopened ticket',
  TICKET_CLOSED: 'closed ticket',
}

export const activityActions = Object.keys(activityActionLabels) as ActivityAction[]

export function describeActivity(action: ActivityAction, oldValue: string | null, newValue: string | null): string {
  const label = activityActionLabels[action]
  if (action === 'STATUS_CHANGED' || action === 'PRIORITY_CHANGED') {
    return oldValue && oldValue !== newValue ? `${label} from ${oldValue} to ${newValue}` : `${label} to ${newValue}`
  }
  return label
}