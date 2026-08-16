import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityApi } from '../api/activity.api'
import { Card } from '../components/ui/Card'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { EmptyState } from '../components/ui/EmptyState'
import { PageError, PageLoading } from '../components/ui/PageState'
import { activityActions, describeActivity } from '../lib/activityLabels'
import { formatDate } from '../lib/format'
import type { ActivityAction } from '../types'

const PAGE_SIZE = 15

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<string>('')

  const activityQuery = useQuery({
    queryKey: ['activity', page, action],
    queryFn: () =>
      activityApi.getAll({
        page,
        pageSize: PAGE_SIZE,
        action: action ? (action as ActivityAction) : undefined,
      }),
    placeholderData: (previousData) => previousData,
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Activity Logs</h1>
        <p className="text-sm text-gray-500">Audit trail of actions across the system.</p>
      </div>

      <Card className="p-4">
        <Select
          id="action-filter"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All actions</option>
          {activityActions.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ').toLowerCase()}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {activityQuery.isError ? (
          <div className="p-4">
            <PageError message="Failed to load activity logs." onRetry={() => activityQuery.refetch()} />
          </div>
        ) : activityQuery.isLoading ? (
          <PageLoading label="Loading activity..." />
        ) : (activityQuery.data?.items.length ?? 0) === 0 ? (
          <EmptyState title="No activity found" description="Try a different filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="hidden px-4 py-3 md:table-cell">When</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="hidden px-4 py-3 md:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activityQuery.data?.items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{a.userName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {a.action.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                      {describeActivity(a.action, a.oldValue, a.newValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activityQuery.data && (
              <div className="px-4">
                <Pagination
                  page={activityQuery.data.page}
                  total={activityQuery.data.total}
                  pageSize={activityQuery.data.pageSize}
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