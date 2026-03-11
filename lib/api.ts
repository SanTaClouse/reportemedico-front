const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type FetchOptions = RequestInit & {
  token?: string
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error(error.message || `Error ${res.status}`)
  }

  return res.json()
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

export function getNews(page = 1, limit = 10) {
  return apiFetch<PaginatedResponse<Article>>(`/articles/type/news?page=${page}&limit=${limit}`, {
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

export function incrementViews(slug: string) {
  return apiFetch(`/articles/${slug}/view`, { method: 'POST' })
}

export function submitArticle(data: SubmitArticleData) {
  return apiFetch('/articles/submit', { method: 'POST', body: JSON.stringify(data) })
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

export function getPodcastEpisodes() {
  return apiFetch<PodcastEpisode[]>('/podcast-episodes', { next: { revalidate: 3600 } })
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

export function setArticleRelevance(id: string, relevance: number, token: string) {
  return apiFetch<Article>(`/articles/${id}/relevance`, { method: 'PATCH', body: JSON.stringify({ relevance }), token })
}

export function deleteArticle(id: string, token: string) {
  return apiFetch(`/articles/${id}`, { method: 'DELETE', token })
}

// ─── COUNCIL MEMBERS — PÚBLICO ────────────────────────

export function getCouncilMembers() {
  return apiFetch<CouncilMember[]>('/council-members', { next: { revalidate: 3600 } })
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

// ─── TYPES ────────────────────────────────────────────

export interface Article {
  id: string
  type: 'NEWS' | 'MEDICAL_ARTICLE'
  title: string
  slug: string
  excerpt?: string
  content: string
  featuredImage?: string
  authorName: string
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED'
  relevance: 1 | 2 | 3
  viewsCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags?: ArticleTag[]
  seoMetadata?: SeoMetadata
  sources?: ArticleSource[]
  suggestedSpecialties?: string[]
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
  featured: Article[]
  latest: Article[]
  medicalArticles: Article[]
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
  linkedinUrl?: string
  isFeatured: boolean
  isVisible: boolean
  order: number
  createdAt: string
  updatedAt: string
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
}
