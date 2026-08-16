import type { ReactNode } from 'react'
import { Spinner } from './Spinner'

export function PageLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <Spinner className="h-6 w-6 text-blue-600" />
      <p className="mt-2 text-sm">{label}</p>
    </div>
  )
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button className="mt-2 font-medium underline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="text-xs text-red-600">{children}</p>
}