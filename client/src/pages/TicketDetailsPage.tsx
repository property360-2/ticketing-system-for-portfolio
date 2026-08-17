import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketsApi } from '../api/tickets.api'
import { commentsApi } from '../api/comments.api'
import { attachmentsApi } from '../api/attachments.api'
import { activityApi } from '../api/activity.api'
import { usersApi } from '../api/users.api'
import { useAuth } from '../features/auth/AuthContext'
import { getApiErrorMessage } from '../api/errors'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { PageError, PageLoading } from '../components/ui/PageState'
import { activityActionLabels } from '../lib/activityLabels'
import {
  priorityLabels,
  statusLabels,
  ticketPriorities,
  ticketStatuses,
} from '../lib/constants'
import {
  formatDate,
  formatFileSize,
  priorityTone,
  statusTone,
} from '../lib/format'
import type { Ticket, TicketComment, TicketPriority, TicketStatus } from '../types'

export default function TicketDetailsPage() {
  const { ticketId } = useParams()
  const id = Number(ticketId)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)

  const ticketQuery = useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getById(id),
    enabled: Number.isFinite(id),
  })
  const commentsQuery = useQuery({
    queryKey: ['tickets', id, 'comments'],
    queryFn: () => commentsApi.getAll(id),
    enabled: Number.isFinite(id),
  })
  const attachmentsQuery = useQuery({
    queryKey: ['tickets', id, 'attachments'],
    queryFn: () => attachmentsApi.getAll(id),
    enabled: Number.isFinite(id),
  })
  const activityQuery = useQuery({
    queryKey: ['tickets', id, 'activity'],
    queryFn: () => activityApi.getForTicket(id),
    enabled: Number.isFinite(id),
  })
  const usersQuery = useQuery({
    queryKey: ['users', 'technicians'],
    queryFn: () => usersApi.getAll({ role: 'TECHNICIAN', pageSize: 100 }),
    enabled: user?.role === 'ADMIN',
  })

  const technicians = (usersQuery.data?.items ?? []).filter((u) => u.role === 'TECHNICIAN')

  const invalidateTicket = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets', id] })
    queryClient.invalidateQueries({ queryKey: ['tickets', id, 'comments'] })
    queryClient.invalidateQueries({ queryKey: ['tickets', id, 'attachments'] })
    queryClient.invalidateQueries({ queryKey: ['tickets', id, 'activity'] })
    queryClient.invalidateQueries({ queryKey: ['tickets'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(id, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', id, 'comments'] })

      const previousComments = queryClient.getQueryData<TicketComment[]>(['tickets', id, 'comments'])
      const previousTicket = queryClient.getQueryData<Ticket>(['tickets', id])

      const tempComment: TicketComment = {
        id: -Date.now(),
        content,
        userId: user?.id ?? '',
        userName: user?.name ?? 'You',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<TicketComment[]>(
        ['tickets', id, 'comments'],
        (old) => (old ?? []).concat(tempComment),
      )
      queryClient.setQueryData<Ticket>(['tickets', id], (old) =>
        old ? { ...old, commentCount: old.commentCount + 1 } : old,
      )

      return { previousComments, previousTicket }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['tickets', id, 'comments'], context.previousComments)
      }
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', id], context.previousTicket)
      }
    },
    onSuccess: () => setComment(''),
    onSettled: () => invalidateTicket(),
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus: TicketStatus) => ticketsApi.updateStatus(id, newStatus),
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', id] })

      const previousTicket = queryClient.getQueryData<Ticket>(['tickets', id])

      queryClient.setQueryData<Ticket>(['tickets', id], (old) => {
        if (!old) return old
        const now = new Date().toISOString()
        const base = { ...old, status: newStatus }
        if (newStatus === 'RESOLVED') {
          return { ...base, resolvedAt: old.resolvedAt ?? now, closedAt: null }
        }
        if (newStatus === 'CLOSED') {
          return { ...base, resolvedAt: old.resolvedAt ?? now, closedAt: now }
        }
        if (newStatus === 'REOPENED') {
          return { ...base, resolvedAt: null, closedAt: null }
        }
        return base
      })

      return { previousTicket }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', id], context.previousTicket)
      }
    },
    onSettled: () => invalidateTicket(),
  })

  const priorityMutation = useMutation({
    mutationFn: (newPriority: TicketPriority) => ticketsApi.updatePriority(id, newPriority),
    onMutate: async (newPriority) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', id] })

      const previousTicket = queryClient.getQueryData<Ticket>(['tickets', id])

      queryClient.setQueryData<Ticket>(['tickets', id], (old) =>
        old ? { ...old, priority: newPriority } : old,
      )

      return { previousTicket }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', id], context.previousTicket)
      }
    },
    onSettled: () => invalidateTicket(),
  })

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) => ticketsApi.assign(id, assignedToId),
    onMutate: async (assignedToId) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', id] })

      const previousTicket = queryClient.getQueryData<Ticket>(['tickets', id])
      const technician = technicians.find((t) => t.id === assignedToId)

      queryClient.setQueryData<Ticket>(['tickets', id], (old) =>
        old
          ? { ...old, assignedToId, assignedToName: technician?.name ?? null }
          : old,
      )

      return { previousTicket }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(['tickets', id], context.previousTicket)
      }
    },
    onSettled: () => invalidateTicket(),
  })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => attachmentsApi.upload(id, files),
    onSuccess: () => {
      setFileInputKey((k) => k + 1)
      invalidateTicket()
    },
  })

  const removeAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => attachmentsApi.remove(id, attachmentId),
    onSuccess: invalidateTicket,
  })

  if (ticketQuery.isLoading) return <PageLoading label="Loading ticket..." />
  if (ticketQuery.isError || !ticketQuery.data) {
    return <PageError message="Unable to load this ticket." onRetry={() => ticketQuery.refetch()} />
  }

  const ticket = ticketQuery.data
  const isAdmin = user?.role === 'ADMIN'
  const isAssignedTech = user?.role === 'TECHNICIAN' && ticket.assignedToId === user?.id
  const isCreator = ticket.createdById === user?.id
  const canManageStatus = isAdmin || isAssignedTech || (isCreator && ['EMPLOYEE', 'TECHNICIAN'].includes(user?.role ?? ''))

  const handleStatus = (value: string) => {
    if (value === ticket.status) return
    statusMutation.mutate(value as TicketStatus, {
      onError: (e) => setActionError(getApiErrorMessage(e)),
    })
  }

  const handlePriority = (value: string) => {
    if (value === ticket.priority) return
    priorityMutation.mutate(value as TicketPriority, {
      onError: (e) => setActionError(getApiErrorMessage(e)),
    })
  }

  const handleAssign = (value: string) => {
    assignMutation.mutate(value || null, {
      onError: (e) => setActionError(getApiErrorMessage(e)),
    })
  }

  const handleComment = () => {
    if (!comment.trim()) return
    setError(null)
    addCommentMutation.mutate(comment.trim(), {
      onError: (e) => setError(getApiErrorMessage(e)),
    })
  }

  const canModify = isAdmin || isCreator || isAssignedTech

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/tickets" className="text-sm text-blue-600 hover:underline">
            &larr; Back to tickets
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-gray-800">
            <span className="text-gray-400">#{ticket.id}</span>
            {ticket.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={statusTone[ticket.status]}>{statusLabels[ticket.status]}</Badge>
            <Badge tone={priorityTone[ticket.priority]}>{priorityLabels[ticket.priority]}</Badge>
            <Badge tone="blue">{ticket.categoryName}</Badge>
            <Badge tone="gray">{ticket.departmentName}</Badge>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-800">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{ticket.description}</p>
            <div className="mt-4 flex flex-wrap gap-6 border-t border-gray-100 pt-4 text-sm text-gray-600">
              <div>
                <p className="text-xs text-gray-400">Created by</p>
                <p className="font-medium">{ticket.createdByName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Assigned to</p>
                <p className="font-medium">{ticket.assignedToName ?? '\u2014'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Created</p>
                <p>{formatDate(ticket.createdAt)}</p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs text-gray-400">Resolved</p>
                  <p>{formatDate(ticket.resolvedAt)}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-800">Attachments</h2>
            <div className="mt-3 space-y-2">
              {(attachmentsQuery.data ?? []).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-gray-400">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 3a2 2 0 012-2h6l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V3zM11 3.5V8a1 1 0 001 1h4.5L11 3.5z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <a
                        href={attachmentsApi.downloadUrl(id, a.id)}
                        className="block truncate text-sm font-medium text-blue-600 hover:underline"
                      >
                        {a.fileName}
                      </a>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(a.fileSize)} &middot; uploaded by {a.uploadedByName}
                      </p>
                    </div>
                  </div>
                  {(isAdmin || a.uploadedById === user?.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachmentMutation.mutate(a.id)}
                      loading={removeAttachmentMutation.isPending}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {canModify && (
              <div className="mt-3">
                <input
                  key={fileInputKey}
                  type="file"
                  multiple
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length) uploadMutation.mutate(files)
                  }}
                />
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-800">Comments</h2>
            <div className="mt-3 space-y-3">
              {(commentsQuery.data ?? []).map((c) => (
                <div key={c.id} className="rounded-md bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{c.userName}</span>
                    <span>{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
                </div>
              ))}
              {(commentsQuery.data?.length ?? 0) === 0 && (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}
            </div>

            <div className="mt-4">
              <Textarea
                rows={3}
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              <div className="mt-2 flex justify-end">
                <Button onClick={handleComment} loading={addCommentMutation.isPending}>
                  Add comment
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-800">Activity</h2>
            <ul className="mt-3 space-y-2">
              {(activityQuery.data ?? []).map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                  <div className="text-gray-700">
                    <span className="font-medium">{a.userName}</span>{' '}
                    {activityActionLabels[a.action]}{' '}
                    {a.newValue && <span className="font-medium text-gray-800">{a.newValue}</span>}
                    <span className="block text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                  </div>
                </li>
              ))}
              {(activityQuery.data?.length ?? 0) === 0 && (
                <p className="text-sm text-gray-500">No activity recorded.</p>
              )}
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          {isAdmin && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-800">Assignment</h2>
              <div className="mt-3">
                <Select
                  id="assign"
                  value={ticket.assignedToId ?? ''}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-800">Actions</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="status" className="mb-1 block text-xs font-medium text-gray-500">
                  Status
                </label>
                <Select
                  id="status"
                  value={ticket.status}
                  onChange={(e) => handleStatus(e.target.value)}
                  disabled={!canManageStatus}
                >
                  {ticketStatuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="priority" className="mb-1 block text-xs font-medium text-gray-500">
                  Priority
                </label>
                <Select
                  id="priority"
                  value={ticket.priority}
                  onChange={(e) => handlePriority(e.target.value)}
                  disabled={!canModify}
                >
                  {ticketPriorities.map((p) => (
                    <option key={p} value={p}>
                      {priorityLabels[p]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5 text-sm text-gray-600">
            <h2 className="text-sm font-semibold text-gray-800">Details</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">Department</dt>
                <dd>{ticket.departmentName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Category</dt>
                <dd>{ticket.categoryName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Comments</dt>
                <dd>{ticket.commentCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Attachments</dt>
                <dd>{ticket.attachmentCount}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}