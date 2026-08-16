import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/axios'

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<{ status: string }>('/health').then((res) => res.data),
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        {isLoading && <p className="text-sm text-gray-500">Checking API connection...</p>}
        {isError && <p className="text-sm text-red-500">API is unreachable.</p>}
        {data && (
          <p className="text-sm text-gray-700">
            API status: <span className="font-medium text-green-600">{data.status}</span>
          </p>
        )}
      </div>
    </div>
  )
}
