/**
 * API client del módulo Bio (link in bio · reportemedico.com/bio).
 * Mismo patrón que lib/api-guia.ts: funciones tipadas sobre apiFetch.
 * Público (página + tracking) y admin (CRUD + estadísticas, con token rm_token).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type FetchOptions = RequestInit & { token?: string }

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: '' }))
    throw new Error(body.message || `Error ${res.status}`)
  }
  return res.json()
}

// ─── TYPES ────────────────────────────────────────────

export interface BioPublicLink {
  id: string
  label: string
  icon: string | null
}

export interface BioPublicPage {
  slug: string
  title: string
  subtitle: string | null
  avatarUrl: string | null
  links: BioPublicLink[]
}

export interface BioAdminLink {
  id: string
  label: string
  url: string
  icon: string | null
  isActive: boolean
  order: number
  startsAt: string | null
  endsAt: string | null
}

export interface BioAdminPage {
  id: string
  slug: string
  title: string
  subtitle: string | null
  avatarUrl: string | null
  isActive: boolean
  links: BioAdminLink[]
}

export interface BioLinkStat {
  id: string
  label: string
  icon: string | null
  isActive: boolean
  clicks: number
}

export interface BioStats {
  range: number
  views: number
  clicks: number
  ctr: number
  viewsAllTime: number
  clicksAllTime: number
  links: BioLinkStat[]
  series: { date: string; views: number; clicks: number }[]
}

export interface UpdateBioPageInput {
  title?: string
  subtitle?: string | null
  avatarUrl?: string | null
  isActive?: boolean
}

export interface BioLinkInput {
  label?: string
  url?: string
  icon?: string | null
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
}

// ─── PÚBLICO ──────────────────────────────────────────

/** Página + enlaces visibles. ISR; se revalida al editar desde el admin (path /bio). */
export function getBioPublicPage() {
  return apiFetch<BioPublicPage | null>('/bio/page', { next: { revalidate: 300 } })
}

/** Vista de página (fire-and-forget desde el browser). */
export function trackBioView(referrer?: string) {
  return fetch(`${API_URL}/bio/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(referrer ? { referrer } : {}),
    keepalive: true,
  }).catch(() => undefined)
}

// ─── ADMIN ────────────────────────────────────────────

export function getBioAdmin(token: string) {
  return apiFetch<BioAdminPage>('/bio/admin', { token, cache: 'no-store' })
}

export function getBioStats(token: string, range = 30) {
  return apiFetch<BioStats>(`/bio/admin/stats?range=${range}`, { token, cache: 'no-store' })
}

export function updateBioPage(token: string, data: UpdateBioPageInput) {
  return apiFetch<BioAdminPage>('/bio/admin/page', {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function createBioLink(token: string, data: BioLinkInput) {
  return apiFetch<BioAdminLink>('/bio/admin/links', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export function updateBioLink(token: string, id: string, data: BioLinkInput) {
  return apiFetch<BioAdminLink>(`/bio/admin/links/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(data),
  })
}

export function deleteBioLink(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/bio/admin/links/${id}`, {
    method: 'DELETE',
    token,
  })
}

export function reorderBioLinks(token: string, orderedLinkIds: string[]) {
  return apiFetch<{ success: boolean }>('/bio/admin/links/reorder', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ orderedLinkIds }),
  })
}
