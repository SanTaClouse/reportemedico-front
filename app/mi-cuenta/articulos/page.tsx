import { auth0 } from '@/lib/auth0'
import { getTags } from '@/lib/api'
import MiArticulosClient from './MiArticulosClient'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface MyArticle {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED'
  type: 'NEWS' | 'MEDICAL_ARTICLE'
  createdAt: string
  publishedAt: string | null
}

export default async function MiCuentaArticulosPage() {
  let mine: MyArticle[] = []
  let hasProfile = false
  try {
    const { accessToken } = await auth0.getAccessToken()
    const [mineRes, meRes] = await Promise.all([
      fetch(`${API_URL}/articles/mine`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }),
      fetch(`${API_URL}/doctors/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }),
    ])
    if (mineRes.ok) mine = await mineRes.json()
    if (meRes.ok) hasProfile = Boolean((await meRes.json()).doctor)
  } catch {
    // sin sesión / backend: el cliente muestra el estado correspondiente
  }

  const tags = await getTags().catch(() => [])

  return <MiArticulosClient initialArticles={mine} hasProfile={hasProfile} tags={tags} />
}
