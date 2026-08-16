import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ticketsApi } from '../api/tickets.api'
import { departmentsApi } from '../api/departments.api'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { PageError, PageLoading } from '../components/ui/PageState'
import { useAuth } from '../features/auth/AuthContext'
import { priorityLabels, statusLabels, ticketPriorities, ticketStatuses } from '../lib/constants'
import { formatDate, priorityTone, statusTone } from '../lib/format'
import type { TicketPriority, TicketStatus } from '../types'

const PAGE_SIZE = 10

export default function TicketsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  })

  const ticketsQuery = useQuery({
    queryKey: ['tickets', page, status, priority, departmentId, search],
    queryFn: () =>
      ticketsApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        status: status ? (status as TicketStatus) : undefined,
        priority: priority ? (priority as TicketPriority) : undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        search: search || undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {user?.role === 'EMPLOYEE' ? 'My Tickets' : 'Tickets'}
          </h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'EMPLOYEE'
              ? 'Tickets you submitted.'
              : user?.role === 'TECHNICIAN'
                ? 'Tickets assigned to you or submitted by you.'
                : 'All tickets in the system.'}
          </p>
        </div>
        {user?.role !== 'ADMIN' && (
          <Link
            to="/tickets/create"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Create Ticket
          </Link>
        )}
      </div>

      <Card className="p-4">
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <div className="lg:col-span-2">
            <Input
              id="search"
              placeholder="Search title or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {ticketStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </Select>
          <Select
            id="priority"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All priorities</option>
            {ticketPriorities.map((p) => (
              <option key={p} value={p}>
                {priorityLabels[p]}
              </option>
            ))}
          </Select>
          <Select
            id="department"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All departments</option>
            {(departmentsQuery.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <div className="flex items-center lg:col-span-5">
            <Button type="submit" variant="secondary">
              Apply filters
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {ticketsQuery.isError ? (
          <div className="p-4">
            <PageError
              message="Failed to load tickets."
              onRetry={() => ticketsQuery.refetch()}
            />
          </div>
        ) : ticketsQuery.isLoading ? (
          <PageLoading label="Loading tickets..." />
        ) : (ticketsQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="No tickets found"
            description="Try adjusting your filters, or create a new ticket."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="hidden px-4 py-3 xl:table-cell">Category</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Department</th>
                  {user?.role !== 'EMPLOYEE' && <th className="hidden px-4 py-3 2xl:table-cell">Created by</th>}
                  <th className="hidden px-4 py-3 md:table-cell">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ticketsQuery.data?.items.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{ticket.id}</td>
                    <td className="max-w-[160px] px-4 py-3 sm:max-w-[320px]">
                      <span className="block truncate font-medium text-gray-800">{ticket.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={priorityTone[ticket.priority]}>
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 xl:table-cell">{ticket.categoryName}</td>
                    <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">{ticket.departmentName}</td>
                    {user?.role !== 'EMPLOYEE' && (
                      <td className="hidden px-4 py-3 text-gray-600 2xl:table-cell">{ticket.createdByName}</td>
                    )}
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ticketsQuery.data && (
              <div className="px-4">
                <Pagination
                  page={ticketsQuery.data.page}
                  total={ticketsQuery.data.total}
                  pageSize={ticketsQuery.data.pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

