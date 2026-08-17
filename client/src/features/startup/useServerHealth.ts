import { useCallback, useEffect, useState } from 'react'
import { checkHealth } from '../../api/health.api'

export type ServerHealthStatus = 'checking' | 'ready' | 'error'

const ATTEMPT_TIMEOUT_MS = 8000
const MAX_SERVER_WAIT_MS = 120_000
const BASE_RETRY_MS = 2000
const MAX_RETRY_MS = 10_000

function retryDelay(tryCount: number): number {
  return Math.min(BASE_RETRY_MS * 2 ** tryCount, MAX_RETRY_MS)
}

function describeResult(timedOut: boolean | undefined): string {
  if (timedOut) return 'The server took too long to respond.'
  return 'Unable to reach the server. It may still be starting up.'
}

export function useServerHealth() {
  const [status, setStatus] = useState<ServerHealthStatus>('checking')
  const [message, setMessage] = useState<string | null>(null)

  const retry = useCallback(() => {
    setMessage(null)
    setStatus('checking')
  }, [])

  useEffect(() => {
    if (status !== 'checking') return

    let cancelled = false
    let timer: number | undefined
    const startedAt = Date.now()

    const attempt = async (tryCount: number) => {
      if (cancelled) return

      const result = await checkHealth(ATTEMPT_TIMEOUT_MS)
      if (cancelled) return

      if (result.ok) {
        setStatus('ready')
        return
      }

      setMessage(describeResult(result.timedOut))

      if (Date.now() - startedAt >= MAX_SERVER_WAIT_MS) {
        setStatus('error')
        return
      }

      timer = window.setTimeout(() => attempt(tryCount + 1), retryDelay(tryCount))
    }

    void attempt(0)

    return () => {
      cancelled = true
      if (timer !== undefined) {
        window.clearTimeout(timer)
      }
    }
  }, [status])

  return { status, message, retry }
}