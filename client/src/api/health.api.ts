import { API_BASE_URL } from './axios'

export interface HealthResult {
  ok: boolean
  status?: number
  timedOut?: boolean
}

const HEALTH_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '/api/health')

export async function checkHealth(timeoutMs: number): Promise<HealthResult> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(HEALTH_URL, {
      signal: controller.signal,
      cache: 'no-store',
    })
    return { ok: true, status: response.status, timedOut: false }
  } catch {
    return { ok: false, status: undefined, timedOut: controller.signal.aborted }
  } finally {
    window.clearTimeout(timer)
  }
}