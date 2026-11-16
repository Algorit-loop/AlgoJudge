// Thin fetch wrapper for the JSON API. Errors carry the API's machine-readable code,
// which the UI translates with t(`errors.${code}`).

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly field?: string

  constructor(status: number, code: string, field?: string) {
    super(code)
    this.status = status
    this.code = code
    this.field = field
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export async function api<T>(path: string, options: { method?: Method; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      // Same origin through nginx, so the session cookie is sent automatically.
      credentials: 'same-origin',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network')
  }
  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = (data as { detail?: { code?: string; field?: string } } | null)?.detail
    throw new ApiError(res.status, detail?.code ?? 'unknown', detail?.field)
  }
  return data as T
}

export function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : 'unknown'
}
