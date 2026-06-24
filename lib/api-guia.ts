/**
 * API client de la Guía Médica (V2) — separado de lib/api.ts (P6: extensión, no refactor).
 * Mismo patrón: funciones tipadas sobre apiFetch, token JWT del admin (rm_token).
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

export interface Specialty {
  id: string
  slug: string
  name: string
  schemaOrgValue?: string | null
  _count?: { doctors: number; tags: number }
}

export interface City {
  id: string
  slug: string
  name: string
  _count?: { clinics: number }
}

export interface Clinic {
  id: string
  slug: string
  name: string
  address: string
  cityId: string
  city?: City
  latitude: number
  longitude: number
  phone?: string | null
  _count?: { doctors: number }
  locationWarning?: string
}

export interface Insurance {
  id: string
  slug: string
  name: string
  _count?: { doctors: number }
}

export type DoctorStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'INACTIVE'
export type DoctorPlan = 'BASIC' | 'PREMIUM'
export type BenefitType = 'REVISTA_DIGITAL' | 'REVISTA_IMPRESA' | 'FOTOGRAFIA' | 'VIDEO' | 'PODCAST' | 'EVENTO'

export interface DoctorBenefit {
  id: string
  type: BenefitType
  deliveredAt?: string | null
  note?: string | null
  createdAt: string
}

export interface ClaimToken {
  id: string
  token: string
  expiresAt: string
  usedAt?: string | null
  createdAt: string
  url?: string
}

export interface Doctor {
  id: string
  auth0Sub?: string | null
  slug: string
  firstName: string
  lastName: string
  title?: string | null
  email?: string | null
  phonePublic?: string | null
  phoneInternal?: string | null
  phoneOffice?: string | null
  instagram?: string | null
  bio?: string | null
  photoUrl?: string | null
  videoUrl?: string | null
  exequatur?: string | null
  isVerified: boolean
  needsReverify: boolean
  languages: string[]
  telehealth: boolean
  emailOptOut: boolean
  status: DoctorStatus
  plan: DoctorPlan
  planNotes?: string | null
  createdAt: string
  updatedAt: string
  specialties: { order: number; specialty: Specialty }[]
  clinics: { schedule?: string | null; clinic: Clinic }[]
  insurances: { insurance: Insurance }[]
  benefits?: DoctorBenefit[]
  claimTokens?: ClaimToken[]
  _count?: { articles: number; whatsappClicks: number; sessions: number }
}

export interface DoctorInput {
  firstName: string
  lastName: string
  title?: string
  email?: string
  phonePublic?: string
  phoneInternal?: string
  phoneOffice?: string
  instagram?: string
  bio?: string
  photoUrl?: string
  videoUrl?: string
  exequatur?: string
  languages?: string[]
  telehealth?: boolean
  status?: DoctorStatus
  plan?: DoctorPlan
  planNotes?: string
  specialtyIds?: string[]
  clinics?: { clinicId: string; schedule?: string }[]
  insuranceIds?: string[]
}

export interface DoctorListResponse {
  items: Doctor[]
  total: number
  page: number
  limit: number
}

export interface IndexableCombinations {
  specialties: { slug: string; name: string }[]
  cities: { slug: string; name: string }[]
  clinics: { slug: string; name: string }[]
  pairs: { specialtySlug: string; citySlug: string }[]
}

export const BENEFIT_LABELS: Record<BenefitType, string> = {
  REVISTA_DIGITAL: 'Publicación en revista digital',
  REVISTA_IMPRESA: 'Publicación en revista impresa',
  FOTOGRAFIA: 'Sesión de fotografía profesional',
  VIDEO: 'Video de presentación',
  PODCAST: 'Invitación al podcast',
  EVENTO: 'Invitación VIP a evento',
}

export const DOCTOR_STATUS_LABELS: Record<DoctorStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PUBLISHED: 'Publicado',
  INACTIVE: 'Inactivo',
}

// ─── CATÁLOGOS ────────────────────────────────────────

export const getSpecialties = () => apiFetch<Specialty[]>('/specialties', { cache: 'no-store' })
export const createSpecialty = (data: { name: string; schemaOrgValue?: string }, token: string) =>
  apiFetch<Specialty>('/specialties', { method: 'POST', body: JSON.stringify(data), token })
export const updateSpecialty = (id: string, data: { name?: string; schemaOrgValue?: string }, token: string) =>
  apiFetch<Specialty>(`/specialties/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
export const deleteSpecialty = (id: string, token: string) =>
  apiFetch(`/specialties/${id}`, { method: 'DELETE', token })

export const getCities = () => apiFetch<City[]>('/cities', { cache: 'no-store' })
export const createCity = (data: { name: string }, token: string) =>
  apiFetch<City>('/cities', { method: 'POST', body: JSON.stringify(data), token })
export const updateCity = (id: string, data: { name?: string }, token: string) =>
  apiFetch<City>(`/cities/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
export const deleteCity = (id: string, token: string) =>
  apiFetch(`/cities/${id}`, { method: 'DELETE', token })

export const getClinics = () => apiFetch<Clinic[]>('/clinics', { cache: 'no-store' })
export interface ClinicInput {
  name?: string
  address?: string
  cityId?: string
  latitude?: number
  longitude?: number
  phone?: string
}
export const createClinic = (data: Required<Omit<ClinicInput, 'phone'>> & { phone?: string }, token: string) =>
  apiFetch<Clinic>('/clinics', { method: 'POST', body: JSON.stringify(data), token })
export const updateClinic = (id: string, data: ClinicInput, token: string) =>
  apiFetch<Clinic>(`/clinics/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
export const deleteClinic = (id: string, token: string) =>
  apiFetch(`/clinics/${id}`, { method: 'DELETE', token })

export const getInsurances = () => apiFetch<Insurance[]>('/insurances', { cache: 'no-store' })
export const createInsurance = (data: { name: string }, token: string) =>
  apiFetch<Insurance>('/insurances', { method: 'POST', body: JSON.stringify(data), token })
export const updateInsurance = (id: string, data: { name?: string }, token: string) =>
  apiFetch<Insurance>(`/insurances/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
export const deleteInsurance = (id: string, token: string) =>
  apiFetch(`/insurances/${id}`, { method: 'DELETE', token })

// ─── MÉDICOS — ADMIN ──────────────────────────────────

export function getDoctorsAdmin(
  params: { status?: string; search?: string; page?: number; limit?: number },
  token: string,
) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  qs.set('page', String(params.page ?? 1))
  qs.set('limit', String(params.limit ?? 20))
  return apiFetch<DoctorListResponse>(`/doctors?${qs}`, { token, cache: 'no-store' })
}

export const getDoctorAdmin = (id: string, token: string) =>
  apiFetch<Doctor>(`/doctors/${id}`, { token, cache: 'no-store' })

export const getPendingDoctorsCount = (token: string) =>
  apiFetch<{ count: number; reverifyCount: number }>('/doctors/pending-count', { token, cache: 'no-store' })

/** Médicos publicados que editaron su identidad y esperan re-verificación (06 §7) */
export const getReverifyDoctors = (token: string) =>
  apiFetch<Doctor[]>('/doctors/reverify', { token, cache: 'no-store' })

/** Posibles duplicados de un médico: mismo nombre o exequátur (07 §2) */
export const getDoctorDuplicates = (id: string, token: string) =>
  apiFetch<Doctor[]>(`/doctors/${id}/duplicates`, { token, cache: 'no-store' })

/** Fusiona el duplicado (sourceId) dentro del destino (targetId) — 07 §2 */
export const mergeDoctors = (
  targetId: string,
  sourceId: string,
  fromSource: string[],
  token: string,
) =>
  apiFetch<Doctor>('/doctors/merge', {
    method: 'POST',
    body: JSON.stringify({ targetId, sourceId, fromSource }),
    token,
  })

export interface EngagementRow {
  id: string
  slug: string
  name: string
  plan: DoctorPlan
  status: DoctorStatus
  lastSession: string | null
  sessions30d: number
  sessionsTotal: number
  whatsappClicks30d: number
  whatsappClicksTotal: number
  viaEmailSessions: number
  articles: number
}

export const getEngagement = (token: string) =>
  apiFetch<EngagementRow[]>('/doctors/engagement', { token, cache: 'no-store' })

// ─── Digest de noticias por especialidad para médicos (08 §1) ────────────────

export interface DoctorDigestPreview {
  articlePool: number
  eligibleDoctors: number
  willReceive: number
  lastSentAt: string | null
  lastSend: { sentAt: string; recipients: number; auto: boolean } | null
}

export interface DoctorDigestResult {
  eligible: number
  targeted?: number
  sent: number
  failed: number
  skipped?: boolean
}

export const getDoctorDigestPreview = (token: string) =>
  apiFetch<DoctorDigestPreview>('/subscribers/doctor-digest/preview', { token, cache: 'no-store' })

export const sendDoctorDigest = (token: string) =>
  apiFetch<DoctorDigestResult>('/subscribers/doctor-digest/send', {
    method: 'POST',
    token,
    signal: AbortSignal.timeout(300000),
  })

export const createDoctor = (data: DoctorInput, token: string) =>
  apiFetch<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(data), token })

export const updateDoctor = (id: string, data: Partial<DoctorInput>, token: string) =>
  apiFetch<Doctor>(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })

export const setDoctorStatus = (id: string, status: DoctorStatus, token: string) =>
  apiFetch<Doctor>(`/doctors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token })

export const setDoctorPlan = (id: string, plan: DoctorPlan, planNotes: string | undefined, token: string) =>
  apiFetch<Doctor>(`/doctors/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan, planNotes }), token })

export const setDoctorVerification = (id: string, isVerified: boolean, exequatur: string | undefined, token: string) =>
  apiFetch<Doctor>(`/doctors/${id}/verification`, {
    method: 'PATCH',
    body: JSON.stringify({ isVerified, ...(exequatur !== undefined ? { exequatur } : {}) }),
    token,
  })

export const createDoctorClaimToken = (id: string, token: string) =>
  apiFetch<ClaimToken>(`/doctors/${id}/claim-token`, { method: 'POST', token })

export const addDoctorBenefit = (
  id: string,
  data: { type: BenefitType; deliveredAt?: string; note?: string },
  token: string,
) => apiFetch<DoctorBenefit>(`/doctors/${id}/benefits`, { method: 'POST', body: JSON.stringify(data), token })

export const updateDoctorBenefit = (
  id: string,
  benefitId: string,
  data: { deliveredAt?: string | null; note?: string },
  token: string,
) => apiFetch<DoctorBenefit>(`/doctors/${id}/benefits/${benefitId}`, { method: 'PATCH', body: JSON.stringify(data), token })

export const removeDoctorBenefit = (id: string, benefitId: string, token: string) =>
  apiFetch(`/doctors/${id}/benefits/${benefitId}`, { method: 'DELETE', token })

// ─── MÉDICOS — PÚBLICO ────────────────────────────────

/** Card pública (sin plan ni campos internos — el plan es invisible al paciente) */
export interface PublicDoctorCard {
  id: string
  slug: string
  title?: string | null
  firstName: string
  lastName: string
  photoUrl?: string | null
  isVerified: boolean
  telehealth: boolean
  languages: string[]
  phonePublic?: string | null
  excerpt?: string | null
  specialties: { slug: string; name: string }[]
  clinics: {
    slug: string
    name: string
    address: string
    latitude: number
    longitude: number
    schedule?: string | null
    city: { slug: string; name: string }
  }[]
  insurances: { slug: string; name: string }[]
}

export type PublicDoctorProfile = Omit<
  Doctor,
  'phoneInternal' | 'planNotes' | 'auth0Sub' | 'email' | 'plan' | 'needsReverify'
> & {
  related: PublicDoctorCard[]
}

export interface SpecialtyArticle {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  featuredImage?: string | null
  publishedAt?: string | null
  type: 'NEWS' | 'MEDICAL_ARTICLE'
  authorName: string
}

export const getDoctorBySlug = (slug: string) =>
  apiFetch<PublicDoctorProfile>(`/doctors/slug/${slug}`, { next: { revalidate: 3600 } })

export const getIndexableCombinations = () =>
  apiFetch<IndexableCombinations>('/doctors/indexable', { next: { revalidate: 600 } })

export function getPublicDoctors(filters: { specialty?: string; city?: string; clinic?: string }) {
  const qs = new URLSearchParams()
  if (filters.specialty) qs.set('specialty', filters.specialty)
  if (filters.city) qs.set('city', filters.city)
  if (filters.clinic) qs.set('clinic', filters.clinic)
  return apiFetch<PublicDoctorCard[]>(`/doctors/public-list?${qs}`, { next: { revalidate: 3600 } })
}

export const getSpecialtyBySlug = (slug: string) =>
  apiFetch<Specialty>(`/specialties/${slug}`, { next: { revalidate: 3600 } })

export const getSpecialtyArticles = (slug: string, limit = 4) =>
  apiFetch<SpecialtyArticle[]>(`/specialties/${slug}/articles?limit=${limit}`, { next: { revalidate: 600 } })

export const getCityBySlugPublic = (slug: string) =>
  apiFetch<City & { clinics: Clinic[] }>(`/cities/${slug}`, { next: { revalidate: 3600 } })

export const getClinicBySlugPublic = (slug: string) =>
  apiFetch<Clinic>(`/clinics/${slug}`, { next: { revalidate: 3600 } })

// ─── Textos editoriales de programáticas (03 §7 fase 2 / 07 §6) ──────────────

export interface ProgrammaticPair {
  specialtyId: string
  specialtyName: string
  specialtySlug: string
  cityId: string
  cityName: string
  citySlug: string
  doctorCount: number
  introText: string | null
}

/** Público: texto editorial de una combinación esp × ciudad (null si no hay) */
export const getProgrammaticIntro = (specialtySlug: string, citySlug: string) =>
  apiFetch<{ introText: string | null }>(`/programmatic-content/${specialtySlug}/${citySlug}`, {
    next: { revalidate: 3600 },
  })

/** Admin: combinaciones indexables con conteo + introText */
export const getProgrammaticPairs = (token: string) =>
  apiFetch<ProgrammaticPair[]>('/programmatic-content', { token, cache: 'no-store' })

/** Admin: guarda (o borra si va vacío) el texto editorial de una combinación */
export const saveProgrammaticIntro = (
  data: { specialtyId: string; cityId: string; introText: string },
  token: string,
) =>
  apiFetch<{ introText: string | null }>('/programmatic-content', {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  })

export interface SearchResult {
  items: (PublicDoctorCard & { distanceKm?: number | null })[]
  total: number
  page: number
  limit: number
}

export interface SuggestItem {
  type: 'doctor' | 'clinic'
  slug: string
  label: string
  sublabel?: string | null
  photoUrl?: string | null
}

export interface SearchFilters {
  seguro?: string
  especialidad?: string
  ciudad?: string
  q?: string
  modalidad?: string
  lat?: string
  lng?: string
  page?: string
}

/** Búsqueda de resultados (SSR) — los params viajan tal cual en la URL (05 §2) */
export function searchDoctors(filters: SearchFilters) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) qs.set(key, value)
  }
  return apiFetch<SearchResult>(`/doctors/search?${qs}`, { cache: 'no-store' })
}

/** Typeahead del buscador (cliente, debounced) */
export function suggestDoctors(q: string) {
  return apiFetch<SuggestItem[]>(`/doctors/suggest?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
}

/** Registro de clic de WhatsApp (fire-and-forget desde el browser) */
export function trackWhatsAppClick(doctorId: string, source: 'profile' | 'search-card' | 'clinic-page') {
  return fetch(`${API_URL}/engagement/whatsapp-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId, source }),
    keepalive: true,
  }).catch(() => undefined)
}

// ─── MEDIA ────────────────────────────────────────────

/** Foto de médico (admin) → Cloudinary Reporte-Medico/Medicos */
export async function uploadFotoMedico(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_URL}/media/upload/medicos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error al subir imagen' }))
    throw new Error(error.message || `Error ${res.status}`)
  }
  return res.json()
}
