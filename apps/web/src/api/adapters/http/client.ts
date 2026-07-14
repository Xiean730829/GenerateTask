import type { ApiEnvelope } from '@/api/types/common'
import { ApiError } from '@/api/types/common'

export interface HttpClient {
  fetch<T>(path: string, init?: RequestInit): Promise<T>
  get<T>(path: string): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete(path: string): Promise<void>
}

export function createHttpClient(baseUrl: string): HttpClient {
  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
    const body = (await res.json()) as ApiEnvelope<T>
    if (!body.success || body.data === null) {
      throw new ApiError(body.error ?? { code: 'UNKNOWN', message: `HTTP ${res.status}` })
    }
    return body.data
  }

  return {
    fetch: apiFetch,
    get: (path) => apiFetch(path),
    post: (path, body) => apiFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: (path, body) => apiFetch(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: async (path) => { await apiFetch<null>(path, { method: 'DELETE' }) },
  }
}
