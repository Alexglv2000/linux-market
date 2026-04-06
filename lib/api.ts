/**
 * lib/api.ts
 * Capa de cliente para el servidor Express (puerto 3001).
 * Reemplaza IndexedDB para operaciones que necesitan compartirse entre equipos.
 */

// Detectar URL base del servidor API (mismo host, puerto 3001)
function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001'
  const host = window.location.hostname
  return `http://${host}:3001`
}

export const API_BASE = typeof window !== 'undefined' ? getApiBase() : 'http://localhost:3001'

// JWT token management helpers
const TOKEN_KEY = 'linuxmarket_token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Attach JWT token to every request if available
  const token = getStoredToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.details || err.error || `API error ${res.status}`)
  }
  return res.json()
}

// ── AUTH ───────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string, force: boolean = false) =>
    apiFetch<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, force }),
    }),
  updateProfile: (data: { id: number; currentPassword: string; newUsername?: string; newPassword?: string; newName?: string; newEmail?: string }) =>
    apiFetch<{ success: boolean; user: any }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── PRODUCTOS ─────────────────────────────────────────────────
export const productsApi = {
  getAll: (activeOnly = true) =>
    apiFetch<any[]>(`/api/products${activeOnly ? '?active=1' : ''}`),

  getBySku: (sku: string) =>
    apiFetch<any>(`/api/products?sku=${encodeURIComponent(sku)}`).then(r => Array.isArray(r) ? r[0] : r),

  create: (product: any) =>
    apiFetch<any>('/api/products', { method: 'POST', body: JSON.stringify(product) }),

  update: (id: number, product: any) =>
    apiFetch<any>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),

  updateStock: (id: number, stock: number) =>
    apiFetch<any>(`/api/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) }),

  decrementStock: (id: number, quantity: number) =>
    apiFetch<any>(`/api/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ delta: -quantity }) }),

  delete: (id: number) =>
    apiFetch<any>(`/api/products/${id}`, { method: 'DELETE' }),

  bulkImport: (products: any[]) =>
    apiFetch<any>('/api/products/bulk', { method: 'POST', body: JSON.stringify({ products }) }),
}

// ── VENTAS ────────────────────────────────────────────────────
export const salesApi = {
  getAll: (params?: { from?: string; to?: string; userId?: number }) => {
    const q = new URLSearchParams()
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    if (params?.userId) q.set('userId', String(params.userId))
    return apiFetch<any[]>(`/api/sales?${q}`)
  },

  create: (sale: any) =>
    apiFetch<any>('/api/sales', { method: 'POST', body: JSON.stringify(sale) }),
}

// ── USUARIOS ─────────────────────────────────────────────────
export const usersApi = {
  getAll: () => apiFetch<any[]>('/api/users'),

  create: (user: any) =>
    apiFetch<any>('/api/users', { method: 'POST', body: JSON.stringify(user) }),

  update: (id: number, data: any) =>
    apiFetch<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ── STATS & SETTINGS ──────────────────────────────────────────
export const statsApi = {
  get: (params?: { userId?: number }) => {
    const q = new URLSearchParams()
    if (params?.userId) q.set('userId', String(params.userId))
    return apiFetch<any>(`/api/stats?${q}`)
  },
}
export const settingsApi = {
  get: () => apiFetch<any>('/api/settings'),
  set: (key: string, value: string) => apiFetch<any>('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) })
}
export const infoApi = {
  get: () => apiFetch<{ mac: string, platform: string, version: string, ip: string, port: string }>('/api/system/info')
}

// ── ACCOUNTS ─────────────────────────────────────────────────
export const accountsApi = {
  getAll: () => apiFetch<any[]>('/api/accounts'),
  create: (acc: any) => apiFetch<any>('/api/accounts', { method: 'POST', body: JSON.stringify(acc) }),
  delete: (id: number) => apiFetch<any>(`/api/accounts/${id}`, { method: 'DELETE' }),
}

// ── SUCURSALES ───────────────────────────────────────────────
export const sucursalesApi = {
  getAll: () => apiFetch<any[]>('/api/sucursales'),
}

// ── AUDIT ────────────────────────────────────────────────────
export const auditApi = {
  getAll: () => apiFetch<any[]>('/api/audit'),
}

// ── TRANSFERS ────────────────────────────────────────────────
export const transfersApi = {
  getAll: () => apiFetch<any[]>('/api/transfers'),
  create: (data: any) => apiFetch<any>('/api/transfers', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) => apiFetch<any>(`/api/transfers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

// ── LOGS (BUGS) ──────────────────────────────────────────────
export const logsApi = {
  post: (error: any, context?: string) =>
    apiFetch<any>('/api/logs', {
      method: 'POST',
      body: JSON.stringify({
        message: error.message || String(error),
        stack: error.stack,
        context: context || 'Client'
      }),
    }),
}

// ── SSE: Tiempo real ─────────────────────────────────────────
export type RealtimeEvent =
  | 'product_created' | 'product_updated' | 'product_deleted' | 'products_bulk_update'
  | 'sale_created'
  | 'user_created' | 'user_updated'
  | 'transfer_created' | 'transfer_updated'
  | 'settings_updated'
  | 'ping'

export function connectRealtime(
  onEvent: (event: RealtimeEvent, data: any) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  let es: EventSource | null = null
  let retryTimeout: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  const connect = () => {
    if (stopped) return
    es = new EventSource(`${API_BASE}/api/events`)

    es.onopen = () => onStatusChange?.(true)

    es.onerror = () => {
      onStatusChange?.(false)
      es?.close()
      // Reintentar en 3 segundos
      if (!stopped) retryTimeout = setTimeout(connect, 3000)
    }

    const events: RealtimeEvent[] = [
      'product_created', 'product_updated', 'product_deleted', 'products_bulk_update',
      'sale_created', 'user_created', 'user_updated', 'settings_updated',
      'transfer_created', 'transfer_updated', 'ping'
    ]
    for (const ev of events) {
      es.addEventListener(ev, (e: MessageEvent) => {
        try { onEvent(ev, JSON.parse(e.data)) } catch { }
      })
    }
  }

  connect()

  return () => {
    stopped = true
    if (retryTimeout) clearTimeout(retryTimeout)
    es?.close()
    onStatusChange?.(false)
  }
}
