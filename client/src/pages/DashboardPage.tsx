import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import { Card } from '../components/ui/Card'
import { PageError, PageLoading } from '../components/ui/PageState'
import type { CountByValue, DashboardSummary } from '../types'
import { statusLabels } from '../lib/constants'

const barColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
]

function StatCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    { label: 'Total Tickets', value: summary.total, className: 'text-gray-800' },
    { label: 'Open', value: summary.open, className: 'text-blue-600' },
    { label: 'In Progress', value: summary.inProgress, className: 'text-yellow-600' },
    { label: 'Resolved', value: summary.resolved, className: 'text-green-600' },
    { label: 'Closed', value: summary.closed, className: 'text-gray-500' },
    { label: 'Critical', value: summary.critical, className: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-xs font-medium text-gray-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${card.className}`}>{card.value}</p>
        </Card>
      ))}
    </div>
  )
}

function BarList({
  title,
  data,
  emptyLabel = 'No data',
}: {
  title: string
  data: CountByValue[] | undefined
  emptyLabel?: string
}) {
  const items = data ?? []
  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <div key={item.value} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-gray-600">{item.value}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${barColors[index % barColors.length]}`}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-medium text-gray-700">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
  })

  const byStatus = useQuery({
    queryKey: ['dashboard', 'status'],
    queryFn: dashboardApi.ticketsByStatus,
  })

  const byPriority = useQuery({
    queryKey: ['dashboard', 'priority'],
    queryFn: dashboardApi.ticketsByPriority,
  })

  const byCategory = useQuery({
    queryKey: ['dashboard', 'category'],
    queryFn: dashboardApi.ticketsByCategory,
  })

  const byDepartment = useQuery({
    queryKey: ['dashboard', 'department'],
    queryFn: dashboardApi.ticketsByDepartment,
  })

  if (summaryQuery.isLoading) {
    return <PageLoading label="Loading dashboard..." />
  }

  if (summaryQuery.isError) {
    return <PageError message="Failed to load dashboard." onRetry={() => summaryQuery.refetch()} />
  }

  const statusItems = (byStatus.data ?? []).map((item) => ({
    ...item,
    value: statusLabels[item.value as keyof typeof statusLabels] ?? item.value,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of ticket activity.</p>
      </div>

      {summaryQuery.data && <StatCards summary={summaryQuery.data} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title="Tickets by Status" data={statusItems} />
        <BarList title="Tickets by Priority" data={byPriority.data} />
        <BarList title="Tickets by Category" data={byCategory.data} emptyLabel="Create tickets to see breakdowns" />
        <BarList title="Tickets by Department" data={byDepartment.data} emptyLabel="Create tickets to see breakdowns" />
      </div>
    </div>
  )
}