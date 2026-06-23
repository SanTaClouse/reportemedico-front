const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type FetchOptions = RequestInit & {
  token?: string
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

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
    const message = body.message || GENERIC_ERROR_MESSAGES[res.status] || `Error ${res.status}`
    throw new ApiError(res.status, message)
  }

  return res.json()
}

const GENERIC_ERROR_MESSAGES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'No autenticado. Por favor iniciá sesión.',
  403: 'No tenés permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'Ya existe un registro con esos datos.',
  422: 'Los datos enviados no son válidos.',
  500: 'Error interno del servidor. Intentá de nuevo más tarde.',
  503: 'Servicio temporalmente no disponible.',
}

// ─── ARTÍCULOS — PÚBLICO ──────────────────────────────

export function getHomeData() {
  return apiFetch<HomeData>('/articles/home', { next: { revalidate: 300 } })
}

export function getArticles(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Article>>(`/articles?page=${page}&limit=${limit}`, {
    next: { revalidate: 300 },
  })
}

export function getNews(page = 1, limit = 10, sort: 'publishedAt_desc' | 'views_desc' = 'views_desc') {
  return apiFetch<PaginatedResponse<Article>>(`/articles/type/news?page=${page}&limit=${limit}&sort=${sort}`, {
    next: { revalidate: 300 },
  })
}

export function getMedicalArticles(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Article>>(`/articles/type/medical?page=${page}&limit=${limit}`, {
    next: { revalidate: 300 },
  })
}

export function getArticleBySlug(slug: string) {
  return apiFetch<Article>(`/articles/${slug}`, { next: { revalidate: 600 } })
}

export function getArticlesByTag(slug: string, page = 1) {
  return apiFetch<PaginatedResponse<Article>>(`/articles/tag/${slug}?page=${page}`, {
    next: { revalidate: 600 },
  })
}

export function getRelatedByTag(tagSlug: string, limit = 4) {
  return apiFetch<PaginatedResponse<Article>>(
    `/articles/tag/${tagSlug}?sort=views_desc&limit=${limit}`,
    { next: { revalidate: 300 } },
  )
}

export function incrementViews(slug: string) {
  return apiFetch(`/articles/${slug}/view`, { method: 'POST' })
}

export function submitArticle(data: SubmitArticleData) {
  return apiFetch('/articles/submit', { method: 'POST', body: JSON.stringify(data) })
}

export function searchArticles(query: string, page = 1) {
  return apiFetch<PaginatedResponse<Article>>(
    `/articles/search?q=${encodeURIComponent(query)}&page=${page}&limit=10`,
    { next: { revalidate: 60 } },
  )
}

// ─── TAGS ─────────────────────────────────────────────

export function getTags() {
  return apiFetch<Tag[]>('/tags', { next: { revalidate: 3600 } })
}

export function getTagsAdmin(token: string) {
  return apiFetch<Tag[]>('/tags', { token, cache: 'no-store' })
}

export function createTag(name: string, token: string) {
  return apiFetch<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name }), token })
}

export function updateTag(id: string, name: string, token: string) {
  return apiFetch<Tag>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify({ name }), token })
}

export function deleteTag(id: string, token: string) {
  return apiFetch(`/tags/${id}`, { method: 'DELETE', token })
}

export function checkTagExists(name: string) {
  return apiFetch<{ exists: boolean; tag: Tag | null }>(
    `/tags/check?name=${encodeURIComponent(name)}`,
    { cache: 'no-store' },
  )
}

// ─── PRINT EDITIONS ───────────────────────────────────

export function getPrintEditions() {
  return apiFetch<PrintEdition[]>('/print-editions', { next: { revalidate: 3600 } })
}

// ─── PODCAST ──────────────────────────────────────────

export function getPodcastEpisodes(page = 1, limit = 100, q?: string) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (q) qs.set('q', q)
  return apiFetch<PaginatedResponse<PodcastEpisode>>(
    `/podcast-episodes?${qs}`,
    { next: { revalidate: 3600, tags: ['podcast-episodes'] } },
  )
}

// ─── PRINT EDITIONS — ADMIN ───────────────────────────

export function getAdminPrintEditions(token: string) {
  return apiFetch<PrintEdition[]>('/print-editions/admin/all', { token, cache: 'no-store' })
}

export function createPrintEdition(data: Partial<PrintEdition>, token: string) {
  return apiFetch<PrintEdition>('/print-editions', { method: 'POST', body: JSON.stringify(data), token })
}

export function updatePrintEdition(id: string, data: Partial<PrintEdition>, token: string) {
  return apiFetch<PrintEdition>(`/print-editions/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
}

export function deletePrintEdition(id: string, token: string) {
  return apiFetch(`/print-editions/${id}`, { method: 'DELETE', token })
}

// ─── PODCAST EPISODES — ADMIN ─────────────────────────

export function getAdminPodcastEpisodes(token: string) {
  return apiFetch<PodcastEpisode[]>('/podcast-episodes/admin/all', { token, cache: 'no-store' })
}

export function createPodcastEpisode(data: Partial<PodcastEpisode>, token: string) {
  return apiFetch<PodcastEpisode>('/podcast-episodes', { method: 'POST', body: JSON.stringify(data), token })
}

export function updatePodcastEpisode(id: string, data: Partial<PodcastEpisode>, token: string) {
  return apiFetch<PodcastEpisode>(`/podcast-episodes/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
}

export function deletePodcastEpisode(id: string, token: string) {
  return apiFetch(`/podcast-episodes/${id}`, { method: 'DELETE', token })
}

export function reorderPodcastEpisodes(items: { id: string; order: number }[], token: string) {
  return apiFetch('/podcast-episodes/reorder', {
    method: 'POST',
    body: JSON.stringify({ items }),
    token,
  })
}

// ─── MEDIA — ADMIN ────────────────────────────────────

export function getAdminMedia(token: string) {
  return apiFetch<Media[]>('/media', { token, cache: 'no-store' })
}

export function deleteMedia(id: string, token: string) {
  return apiFetch(`/media/${id}`, { method: 'DELETE', token })
}

async function multipartFetch(endpoint: string, file: File, token?: string): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error al subir imagen' }))
    throw new Error(error.message || `Error ${res.status}`)
  }

  return res.json()
}

/** Galería Media (admin) — guarda en BD + Cloudinary/Media */
export async function uploadMedia(file: File, altText: string, token: string): Promise<Media> {
  const formData = new FormData()
  formData.append('file', file)
  if (altText) formData.append('altText', altText)

  const res = await fetch(`${API_URL}/media/upload`, {
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

/** Imagen destacada de noticias (admin) → Cloudinary/Noticias */
export function uploadImagenNoticia(file: File, token: string) {
  return multipartFetch('/media/upload/noticias', file, token)
}

/** Imagen de artículo médico (doctor) → Cloudinary/Articulos — sin auth */
export function uploadImagenArticulo(file: File) {
  return multipartFetch('/media/upload/articulos', file)
}

/** Foto de galería de noticias (admin) → Cloudinary/Galerias — guarda en BD */
export async function uploadFotoGaleria(file: File, altText: string, token: string): Promise<Media & { width?: number; height?: number }> {
  const formData = new FormData()
  formData.append('file', file)
  if (altText) formData.append('altText', altText)

  const res = await fetch(`${API_URL}/media/upload/galeria`, {
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

export function addGalleryImage(
  articleId: string,
  data: { mediaId: string; caption?: string; position?: number },
  token: string,
) {
  return apiFetch<GalleryItem>(`/articles/${articleId}/gallery`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  })
}

export function removeGalleryImage(articleId: string, mediaId: string, token: string) {
  return apiFetch(`/articles/${articleId}/gallery/${mediaId}`, { method: 'DELETE', token })
}

export function reorderGallery(
  articleId: string,
  items: { mediaId: string; position: number }[],
  token: string,
) {
  return apiFetch<GalleryItem[]>(`/articles/${articleId}/gallery/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ items }),
    token,
  })
}

export function updateGalleryCaption(
  articleId: string,
  mediaId: string,
  caption: string,
  token: string,
) {
  return apiFetch<GalleryItem>(`/articles/${articleId}/gallery/${mediaId}/caption`, {
    method: 'PATCH',
    body: JSON.stringify({ caption }),
    token,
  })
}

// ─── ADMIN ────────────────────────────────────────────

export function getAdminArticleById(id: string, token: string) {
  return apiFetch<Article>(`/admin/articles/${id}`, { token, cache: 'no-store' })
}

export function getAdminArticles(params: Record<string, string>, token: string) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch<PaginatedResponse<Article>>(`/admin/articles?${qs}`, { token, cache: 'no-store' })
}

export function login(email: string, password: string) {
  return apiFetch<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function createArticle(data: any, token: string) {
  return apiFetch<Article>('/articles', { method: 'POST', body: JSON.stringify(data), token })
}

export function updateArticle(id: string, data: any, token: string) {
  return apiFetch<Article>(`/articles/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
}

export function setArticleStatus(id: string, status: string, token: string) {
  return apiFetch<Article>(`/articles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token })
}

export function setArticleRelevance(id: string, relevance: number | null, token: string) {
  return apiFetch<Article>(`/articles/${id}/relevance`, { method: 'PATCH', body: JSON.stringify({ relevance }), token })
}

export function deleteArticle(id: string, token: string) {
  return apiFetch(`/articles/${id}`, { method: 'DELETE', token })
}

// ─── COUNCIL MEMBERS — PÚBLICO ────────────────────────

export function getCouncilMembers() {
  return apiFetch<CouncilMember[]>('/council-members', { next: { revalidate: 3600, tags: ['council-members'] } })
}

// ─── COUNCIL MEMBERS — ADMIN ──────────────────────────

export function getAdminCouncilMembers(token: string) {
  return apiFetch<CouncilMember[]>('/council-members/admin/all', { token, cache: 'no-store' })
}

export function createCouncilMember(data: Partial<CouncilMember>, token: string) {
  return apiFetch<CouncilMember>('/council-members', { method: 'POST', body: JSON.stringify(data), token })
}

export function updateCouncilMember(id: string, data: Partial<CouncilMember>, token: string) {
  return apiFetch<CouncilMember>(`/council-members/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
}

export function deleteCouncilMember(id: string, token: string) {
  return apiFetch(`/council-members/${id}`, { method: 'DELETE', token })
}

export function uploadFotoConsejo(file: File, token: string) {
  return multipartFetch('/media/upload/consejo', file, token)
}

// ─── ADS — PÚBLICO ────────────────────────────────────

/**
 * Devuelve todos los anuncios activos para un slot, ordenados por `order`.
 * El componente elige cuál mostrar. Devuelve [] si no hay anuncios.
 */
export async function getActiveAds(slotName: string): Promise<ActiveAd[]> {
  try {
    const data = await apiFetch<ActiveAd[]>(
      `/ads/slot?name=${encodeURIComponent(slotName)}`,
      { cache: 'no-store' },
    )
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function trackAdClick(adId: string) {
  return apiFetch(`/ads/${adId}/click`, { method: 'PATCH' })
}

// ─── ADS — ADMIN ──────────────────────────────────────

export function getAdminAds(token: string) {
  return apiFetch<Ad[]>('/ads', { token, cache: 'no-store' })
}

export function createAd(data: Pick<Ad, 'title' | 'imageUrl' | 'link' | 'isActive'>, token: string) {
  return apiFetch<Ad>('/ads', { method: 'POST', body: JSON.stringify(data), token })
}

export function updateAd(id: string, data: Partial<Pick<Ad, 'title' | 'imageUrl' | 'link' | 'isActive'>>, token: string) {
  return apiFetch<Ad>(`/ads/${id}`, { method: 'PATCH', body: JSON.stringify(data), token })
}

export function deleteAd(id: string, token: string) {
  return apiFetch(`/ads/${id}`, { method: 'DELETE', token })
}

// ─── AD SLOTS — ADMIN ─────────────────────────────────

export function getAdminAdSlots(token: string) {
  return apiFetch<AdSlot[]>('/ad-slots', { token, cache: 'no-store' })
}

/** Asigna un anuncio a un banner/slot */
export function assignAdToSlot(adId: string, slotId: string, token: string) {
  return apiFetch(`/ads/${adId}/slots/${slotId}`, { method: 'POST', token })
}

/** Quita un anuncio de un banner/slot */
export function removeAdFromSlot(adId: string, slotId: string, token: string) {
  return apiFetch(`/ads/${adId}/slots/${slotId}`, { method: 'DELETE', token })
}

/** Actualiza la configuración de un slot (displayMode, isActive, etc.) */
export function updateAdSlot(slotId: string, data: { displayMode?: 'SINGLE' | 'STRIP'; isActive?: boolean }, token: string) {
  return apiFetch<AdSlot>(`/ad-slots/${slotId}`, { method: 'PATCH', body: JSON.stringify(data), token })
}

/** Reordena los anuncios dentro de un slot */
export function reorderSlotAds(slotId: string, orderedAdIds: string[], token: string) {
  return apiFetch(`/ad-slots/${slotId}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedAdIds }),
    token,
  })
}

// ─── TYPES ────────────────────────────────────────────

export interface GalleryItem {
  mediaId: string
  position: number
  caption?: string
  media: {
    id: string
    url: string
    publicId: string
    altText?: string
    width?: number
    height?: number
  }
}

export interface Article {
  id: string
  type: 'NEWS' | 'MEDICAL_ARTICLE'
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: string
  authorName: string
  authorEmail?: string
  authorPhone?: string
  authorInstagram?: string
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED'
  relevance: 1 | 2 | 3 | 4 | 5 | null
  viewsCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags?: ArticleTag[]
  seoMetadata?: SeoMetadata
  sources?: ArticleSource[]
  suggestedSpecialties?: string[]
  media?: GalleryItem[]
}

export interface ArticleTag {
  tag: Tag
}

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
}

export interface SeoMetadata {
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
}

export interface ArticleSource {
  id: string
  title: string
  url?: string
  order: number
}

export interface PrintEdition {
  id: string
  editionNumber: number
  title: string
  coverImage: string
  issuuUrl: string
  publishedAt: string
  isVisible: boolean
}

export interface PodcastEpisode {
  id: string
  title: string
  description?: string
  youtubeId: string
  thumbnailUrl?: string
  order: number
  isVisible: boolean
  publishedAt: string
}

export interface Media {
  id: string
  url: string
  publicId: string
  altText?: string
  width?: number
  height?: number
  createdAt: string
}

export interface User {
  id: string
  email: string
  name?: string
  role: 'ADMIN'
}

export interface HomeData {
  hero: Article | null
  lead: Article | null        // relevance 2 — card grande izquierda
  bigFeatured: Article[]      // relevance 3 — 2 cards derechas
  smallFeatured: Article[]    // relevance 4 — compactas (máx 8)
  actualidad: Article[]       // relevance 5 — grilla 4×3
  medicalArticles: Article[]
}

/** Límites editoriales — espejo del backend para validaciones en el front */
export const RELEVANCE_LIMITS: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 8,
  5: 12,
}

export const RELEVANCE_LABELS: Record<number, string> = {
  1: 'Hero principal',
  2: 'Lead Destacada',
  3: 'Big Destacada',
  4: 'Small Destacada',
  5: 'Actualidad',
}

export function getRelevanceCounts(token: string) {
  return apiFetch<Record<number, number>>('/articles/relevance-counts', {
    token,
    cache: 'no-store',
  })
}

export interface PendingSpecialty {
  articleId: string
  articleTitle: string
  articleStatus: string
  authorName: string
  specialtyName: string
}

export function getPendingSpecialties(token: string) {
  return apiFetch<PendingSpecialty[]>('/articles/pending-specialties', {
    token,
    cache: 'no-store',
  })
}

export function approveSpecialty(articleId: string, name: string, token: string) {
  return apiFetch(`/articles/${articleId}/approve-specialty`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    token,
  })
}

export function rejectSpecialty(articleId: string, name: string, token: string) {
  return apiFetch(`/articles/${articleId}/reject-specialty`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
    token,
  })
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CouncilMember {
  id: string
  name: string
  role: string
  photo?: string
  profileUrl?: string
  isFeatured: boolean
  isVisible: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface AdSlot {
  id: string
  name: string
  description?: string
  isActive: boolean
  displayMode: 'SINGLE' | 'STRIP'
  _count?: { assignments: number }
  /** Anuncios asignados, ordenados por `order` (solo viene del endpoint admin) */
  assignments?: {
    order: number
    ad: { id: string; title: string; imageUrl: string; isActive: boolean }
  }[]
}

/** Respuesta del endpoint público GET /ads/slot?name=X */
export interface AdSlotPublicResponse {
  displayMode: 'SINGLE' | 'STRIP'
  ads: ActiveAd[]
}

export interface Ad {
  id: string
  title: string
  imageUrl: string
  link: string
  isActive: boolean
  clicks: number
  impressions: number
  createdAt: string
  updatedAt: string
  /** Slots donde está asignado (solo viene del endpoint admin) */
  assignments?: {
    slot: Pick<AdSlot, 'id' | 'name' | 'description'>
  }[]
}

/** Solo los campos que el componente público necesita */
export interface ActiveAd {
  id: string
  title: string
  imageUrl: string
  link: string
}

export interface SubmitArticleData {
  title: string
  authorName: string
  featuredImage?: string
  content: string
  excerpt?: string
  tagIds?: string[]
  suggestedSpecialties?: string[]
  sources?: { title: string; url?: string; order?: number }[]
  authorEmail?: string
  authorPhone?: string
  authorInstagram?: string
}

// ─── SUBSCRIBERS ──────────────────────────────────────

export interface Subscriber {
  id: string
  email: string
  name?: string
  source: 'ARTICLE_SUBMISSION' | 'NEWSLETTER_SIGNUP'
  createdAt: string
  tags?: { tag: Tag }[]
}

export interface SubscriberStats {
  total: number
  fromArticles: number
  fromNewsletter: number
  active: number
  unsubscribed: number
}

export function subscribeNewsletter(email: string, name?: string, tagIds?: string[]) {
  return apiFetch<Subscriber>('/subscribers', {
    method: 'POST',
    body: JSON.stringify({ email, name, ...(tagIds?.length ? { tagIds } : {}) }),
  })
}

export function getAdminSubscribers(params: { page?: string; limit?: string }, token: string) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch<PaginatedResponse<Subscriber>>(`/subscribers?${qs}`, { token, cache: 'no-store' })
}

export function getSubscriberStats(token: string) {
  return apiFetch<SubscriberStats>('/subscribers/stats', { token, cache: 'no-store' })
}

// ─── Newsletter / digest (08 §1) ──────────────────────────────────────────────

export interface DigestArticle {
  type: 'NEWS' | 'MEDICAL_ARTICLE'
  title: string
  slug: string
  excerpt: string | null
  featuredImage: string | null
}

export interface NewsletterPreview {
  articles: DigestArticle[]
  recipientCount: number
  days: number
}

export interface NewsletterSendResult {
  total: number
  sent: number
  failed: number
  articles: number
}

export function getNewsletterPreview(token: string) {
  return apiFetch<NewsletterPreview>('/subscribers/newsletter/preview', { token, cache: 'no-store' })
}

/** Envío del digest — timeout largo: itera todos los suscriptores en el server */
export function sendNewsletter(token: string) {
  return apiFetch<NewsletterSendResult>('/subscribers/newsletter/send', {
    method: 'POST',
    body: JSON.stringify({}),
    token,
    signal: AbortSignal.timeout(300000),
  })
}

/** Baja del digest (público, desde el link del email) */
export function unsubscribeNewsletter(s: string, t: string) {
  return apiFetch<{ email: string }>('/subscribers/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ s, t }),
  })
}

// ─── Envío de una noticia por correo (segmentado, 08 §1) ──────────────────────

export interface ArticleAudienceRecipient {
  id: string
  email: string
  name: string | null
  interested: boolean
}

export interface ArticleAudience {
  article: { id: string; title: string; slug: string; type: 'NEWS' | 'MEDICAL_ARTICLE'; status: string }
  tags: string[]
  interestedCount: number
  totalActive: number
  recipients: ArticleAudienceRecipient[]
}

export interface ArticleEmailResult {
  total: number
  sent: number
  failed: number
}

export function getArticleAudience(articleId: string, token: string) {
  return apiFetch<ArticleAudience>(`/subscribers/article/${articleId}/audience`, { token, cache: 'no-store' })
}

/** Envía la noticia a interesados (sin subscriberIds) o a una selección manual */
export function sendArticleEmail(
  articleId: string,
  body: { audience?: 'interested'; subscriberIds?: string[] },
  token: string,
) {
  return apiFetch<ArticleEmailResult>(`/subscribers/article/${articleId}/send`, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
    signal: AbortSignal.timeout(300000),
  })
}
