/**
 * API client de Eventos (Foro de Salud 5.0 — docs/v2/11). Mismo patrón que
 * lib/api-guia.ts: funciones tipadas sobre apiFetch, token JWT (rm_token) para
 * el admin y el escáner.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'

/** Evento en curso: el escáner y los accesos directos apuntan a este */
export const CURRENT_EVENT_SLUG = 'foro-salud-5'

type FetchOptions = RequestInit & { token?: string; next?: { revalidate?: number } }

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
    signal: init.signal ?? AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: '' }))
    const msg = Array.isArray(body.message) ? body.message[0] : body.message
    throw new Error(msg || `Error ${res.status}`)
  }
  return res.json()
}

// ─── TYPES ────────────────────────────────────────────

export type EventAttendance = 'DAY' | 'EVENING' | 'BOTH'
export type EventPart = 'DAY' | 'EVENING'
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type EventSector =
  | 'DOCTOR' | 'HEALTH_PROFESSIONAL' | 'CLINIC_MANAGEMENT' | 'PHARMA' | 'MEDTECH' | 'INSURANCE'
  | 'FINANCE' | 'EDUCATION' | 'PUBLIC_SECTOR' | 'GUILD' | 'STUDENT' | 'OTHER'

export const SECTOR_LABELS: Record<EventSector, string> = {
  DOCTOR: 'Médico/a',
  HEALTH_PROFESSIONAL: 'Otro profesional de la salud',
  CLINIC_MANAGEMENT: 'Clínica u hospital (gestión)',
  PHARMA: 'Industria farmacéutica / laboratorio',
  MEDTECH: 'Tecnología médica',
  INSURANCE: 'ARS / seguros',
  FINANCE: 'Banca / inversión',
  EDUCATION: 'Educación / universidad',
  PUBLIC_SECTOR: 'Sector público',
  GUILD: 'Gremio / sociedad médica',
  STUDENT: 'Estudiante',
  OTHER: 'Otro',
}

export const STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

export interface PublicEvent {
  id: string
  slug: string
  name: string
  venueName: string
  venueAddress: string | null
  mapsUrl: string | null
  dayTitle: string
  dayStartsAt: string
  dayEndsAt: string
  eveningTitle: string
  eveningVenue: string | null
  eveningStartsAt: string
  eveningEndsAt: string
  registrationOpen: boolean
}

export interface EventStats {
  total: number
  pending: number
  approved: number
  rejected: number
  approvedDay: number
  approvedEvening: number
  pendingDay: number
  pendingEvening: number
  checkedInDay: number
  checkedInEvening: number
  bySector: { sector: EventSector; count: number }[]
}

export interface AdminEvent extends PublicEvent {
  dayCapacity: number | null
  eveningCapacity: number | null
  qrSendAt: string
  /** Días antes del evento en que sale el recordatorio con el QR */
  reminderDays: number[]
  createdAt: string
  updatedAt: string
  stats: EventStats
}

export interface RegistrationRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  sector: EventSector
  institution: string | null
  position: string | null
  attendance: EventAttendance
  status: RegistrationStatus
  isVip: boolean
  isTest: boolean
  accessToken: string | null
  approvalEmailSentAt: string | null
  qrEmailSentAt: string | null
  remindersSent: number[]
  reviewedAt: string | null
  createdAt: string
  specialty: { name: string } | null
  specialtyOther: string | null
  doctor: { id: string; slug: string; plan: string } | null
  checkIns: { part: EventPart; createdAt: string }[]
}

export interface RegistrationList {
  items: RegistrationRow[]
  total: number
  page: number
  limit: number
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  sector: EventSector
  specialtyId?: string
  /** Especialidad escrita a mano cuando no está en el catálogo */
  specialtyOther?: string
  institution?: string
  position?: string
  attendance: EventAttendance
  website?: string // honeypot
}

export interface EntryData {
  event: PublicEvent
  registration: {
    firstName: string
    lastName: string
    attendance: EventAttendance
    institution: string | null
    isTest: boolean
  }
  qrValue: string
}

export interface StaffUser {
  id: string
  name: string | null
  email: string
  isActive: boolean
  createdAt: string
}

export interface ScanRegistration {
  id: string
  firstName: string
  lastName: string
  sector: EventSector
  institution: string | null
  position: string | null
  attendance: EventAttendance
  status: RegistrationStatus
  isVip: boolean
  isTest: boolean
  checkIns: { part: EventPart; createdAt: string }[]
}

export type CheckInResult =
  | { result: 'OK'; registration: ScanRegistration; checkedInAt: string; forced: boolean }
  | { result: 'ALREADY'; registration: ScanRegistration; checkedInAt: string; by: string | null }
  | { result: 'WRONG_PART'; registration: ScanRegistration }
  | { result: 'NOT_APPROVED'; registration: ScanRegistration }
  | { result: 'NOT_FOUND' }

export interface LiveData {
  event: { id: string; slug: string; name: string; dayTitle: string; eveningTitle: string }
  stats: EventStats
  latest: {
    id: string
    part: EventPart
    method: string
    createdAt: string
    scannedByName: string | null
    registration: {
      id: string
      firstName: string
      lastName: string
      sector: EventSector
      institution: string | null
      position: string | null
      isVip: boolean
      isTest: boolean
    }
  }[]
}

// ─── HELPERS ──────────────────────────────────────────

const TZ = 'America/Santo_Domingo'

export function partsOf(a: EventAttendance): EventPart[] {
  return a === 'BOTH' ? ['DAY', 'EVENING'] : [a]
}

export function partTitle(e: Pick<PublicEvent, 'dayTitle' | 'eveningTitle'>, part: EventPart) {
  return part === 'DAY' ? e.dayTitle : e.eveningTitle
}

export function attendanceLabel(e: Pick<PublicEvent, 'dayTitle' | 'eveningTitle'>, a: EventAttendance) {
  if (a === 'DAY') return e.dayTitle
  if (a === 'EVENING') return e.eveningTitle
  return `${e.dayTitle} y ${e.eveningTitle}`
}

export function partWindow(e: PublicEvent, part: EventPart) {
  return part === 'DAY'
    ? { start: e.dayStartsAt, end: e.dayEndsAt, where: e.venueName }
    : {
        start: e.eveningStartsAt,
        end: e.eveningEndsAt,
        where: e.eveningVenue ? `${e.eveningVenue} · ${e.venueName}` : e.venueName,
      }
}

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat('es-DO', { timeZone: TZ, ...opts }).format(new Date(iso))

export const formatTime = (iso: string) =>
  formatDate(iso, { hour: 'numeric', minute: '2-digit', hour12: true })

/** La parte del evento que corresponde escanear ahora (la gala a partir del cierre de la jornada) */
export function currentPart(e: Pick<PublicEvent, 'dayEndsAt'>): EventPart {
  return Date.now() >= new Date(e.dayEndsAt).getTime() ? 'EVENING' : 'DAY'
}

const gcalDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function googleCalendarUrl(e: PublicEvent, part: EventPart) {
  const w = partWindow(e, part)
  const qs = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${partTitle(e, part)} — ${e.name}`,
    dates: `${gcalDate(w.start)}/${gcalDate(w.end)}`,
    details: `Programa: ${SITE_URL}/eventos/${e.slug}`,
    location: e.venueAddress ? `${w.where}, ${e.venueAddress}` : w.where,
    ctz: TZ,
  })
  return `https://calendar.google.com/calendar/render?${qs}`
}

/** .ics servido por el back (Apple / Outlook abren "Agregar al calendario") */
export const icsUrl = (slug: string, attendance: EventAttendance) =>
  `${API_URL}/events/${slug}/calendar?attendance=${attendance}`

export const entryUrl = (slug: string, token: string) => `${SITE_URL}/eventos/${slug}/entrada/${token}`

/** Se reexporta para que el admin de eventos lo importe desde un solo lugar */
export { waNumber } from './utils'

// ─── PÚBLICO ──────────────────────────────────────────

export const getEvent = (slug: string) =>
  apiFetch<PublicEvent>(`/events/${slug}`, { next: { revalidate: 60 } })

export const registerForEvent = (slug: string, data: RegisterPayload) =>
  apiFetch<{ ok: true; attendance: EventAttendance }>(`/events/${slug}/registrations`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getEntry = (slug: string, token: string) =>
  apiFetch<EntryData>(`/events/${slug}/entry/${encodeURIComponent(token)}`, { cache: 'no-store' })

// ─── ADMIN ────────────────────────────────────────────

export const getEventsAdmin = (token: string) =>
  apiFetch<AdminEvent[]>('/admin/events', { token, cache: 'no-store' })

export const getEventAdmin = (id: string, token: string) =>
  apiFetch<AdminEvent>(`/admin/events/${id}`, { token, cache: 'no-store' })

export const updateEventAdmin = (id: string, data: Record<string, unknown>, token: string) =>
  apiFetch<AdminEvent>(`/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })

export function getRegistrations(
  id: string,
  f: { status?: string; sector?: string; part?: string; q?: string; vip?: boolean; tests?: boolean; page?: number; limit?: number },
  token: string,
) {
  const qs = new URLSearchParams()
  if (f.status) qs.set('status', f.status)
  if (f.sector) qs.set('sector', f.sector)
  if (f.part) qs.set('part', f.part)
  if (f.q) qs.set('q', f.q)
  if (f.vip) qs.set('vip', 'true')
  if (f.tests) qs.set('tests', 'true')
  if (f.page) qs.set('page', String(f.page))
  if (f.limit) qs.set('limit', String(f.limit))
  return apiFetch<RegistrationList>(`/admin/events/${id}/registrations?${qs}`, { token, cache: 'no-store' })
}

export const setRegistrationStatus = (id: string, ids: string[], status: RegistrationStatus, token: string) =>
  apiFetch<{ updated: number; notifying: number }>(`/admin/events/${id}/registrations/status`, {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
    token,
  })

export const updateRegistration = (id: string, regId: string, data: { isVip?: boolean }, token: string) =>
  apiFetch<RegistrationRow>(`/admin/events/${id}/registrations/${regId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  })

export const deleteRegistration = (id: string, regId: string, token: string) =>
  apiFetch<{ deleted: true }>(`/admin/events/${id}/registrations/${regId}`, { method: 'DELETE', token })

export const resendAccess = (id: string, regId: string, token: string) =>
  apiFetch<{ sent: boolean; smtp: boolean }>(`/admin/events/${id}/registrations/${regId}/resend-access`, {
    method: 'POST',
    token,
  })

// Pruebas
export const createTestRegistration = (
  id: string,
  data: { firstName: string; lastName: string; email: string; attendance: EventAttendance; isVip?: boolean },
  token: string,
) => apiFetch<RegistrationRow>(`/admin/events/${id}/tests`, { method: 'POST', body: JSON.stringify(data), token })

export type TestEmailType = 'received' | 'approved' | 'reminder' | 'access'

export const sendTestEmail = (id: string, regId: string, type: TestEmailType, token: string) =>
  apiFetch<{ sent: boolean; smtp: boolean; to: string }>(`/admin/events/${id}/tests/${regId}/email`, {
    method: 'POST',
    body: JSON.stringify({ type }),
    token,
  })

export async function getEmailPreview(id: string, regId: string, type: TestEmailType, token: string) {
  const res = await fetch(`${API_URL}/admin/events/${id}/tests/${regId}/preview/${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.text()
}

export const resetTestCheckIns = (id: string, token: string) =>
  apiFetch<{ deleted: number }>(`/admin/events/${id}/tests/check-ins`, { method: 'DELETE', token })

export const deleteTests = (id: string, token: string) =>
  apiFetch<{ deleted: number }>(`/admin/events/${id}/tests`, { method: 'DELETE', token })

// Personal de puerta
export interface EmailStatus {
  ok: boolean
  message: string
  config: {
    host: string | null
    port: string | null
    portIsNumber: boolean
    user: string | null
    hasPassword: boolean
    from: string | null
    eventsFrom: string | null
    notifyTo: string | null
    frontendUrl: string
  }
}

/** Diagnóstico del correo en el servidor: distingue "faltan variables" de "el proveedor rechaza" */
export const getEmailStatus = (token: string) =>
  apiFetch<EmailStatus>('/email/verify', { token, cache: 'no-store' })

export const getStaff = (token: string) => apiFetch<StaffUser[]>('/admin/event-staff', { token, cache: 'no-store' })

export const createStaff = (data: { name: string; email: string; password: string }, token: string) =>
  apiFetch<StaffUser>('/admin/event-staff', { method: 'POST', body: JSON.stringify(data), token })

export const updateStaff = (userId: string, data: { isActive?: boolean; password?: string }, token: string) =>
  apiFetch<StaffUser>(`/admin/event-staff/${userId}`, { method: 'PATCH', body: JSON.stringify(data), token })

// ─── ESCÁNER (ADMIN + SCANNER) ────────────────────────

export const getAccessEvent = (slug: string, token: string) =>
  apiFetch<PublicEvent>(`/access/${slug}`, { token, cache: 'no-store' })

export const checkIn = (
  slug: string,
  data: { code?: string; registrationId?: string; part: EventPart; force?: boolean },
  token: string,
) => apiFetch<CheckInResult>(`/access/${slug}/check-in`, { method: 'POST', body: JSON.stringify(data), token })

export const searchAccess = (slug: string, q: string, token: string) =>
  apiFetch<ScanRegistration[]>(`/access/${slug}/search?q=${encodeURIComponent(q)}`, { token })

export const getLive = (slug: string, token: string) =>
  apiFetch<LiveData>(`/access/${slug}/live`, { token, cache: 'no-store' })
