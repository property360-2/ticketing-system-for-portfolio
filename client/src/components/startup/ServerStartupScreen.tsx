import type { ReactNode } from 'react'
import { useServerHealth } from '../../features/startup/useServerHealth'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'

export function ServerStartupScreen({ children }: { children: ReactNode }) {
  const { status, message, retry } = useServerHealth()

  if (status === 'ready') {
    return <>{children}</>
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-semibold text-gray-800">Server unreachable</h1>
          <p className="mt-2 text-sm text-gray-600">
            {message ?? 'The server could not be reached after several attempts.'}
          </p>
          <Button className="mt-5 w-full" onClick={retry}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <p className="text-xl font-semibold text-gray-800">HelpDesk</p>

      <Spinner className="mt-8 h-10 w-10 text-blue-600" />

      <p className="mt-6 text-sm font-medium text-gray-700">Starting server...</p>
      <p className="mt-1 text-xs text-gray-500">
        The server is waking up. This may take a few seconds.
      </p>

      <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-600" />
      </div>
    </div>
  )
}