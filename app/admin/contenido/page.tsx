export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import Link from 'next/link'
import { Suspense } from 'react'
import { getAdminArticles, getTagsAdmin, getRelevanceCounts } from '@/lib/api'
import { Plus } from 'lucide-react'
import ContentFilters from '@/components/admin/ContentFilters'
import ContentTable from '@/components/admin/ContentTable'
import HomePreviewModal from '@/components/admin/HomePreviewModal'

interface Props {
  searchParams: {
    page?: string
    type?: string
    status?: string
    relevance?: string
    tag?: string
    sort?: string
  }
}

export default async function ContenidoPage({ searchParams }: Props) {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const page = Number(searchParams.page) || 1
  const params = {
    page: String(page),
    limit: '20',
    ...(searchParams.type && { type: searchParams.type }),
    ...(searchParams.status && { status: searchParams.status }),
    ...(searchParams.relevance && { relevance: searchParams.relevance }),
    ...(searchParams.tag && { tag: searchParams.tag }),
    sort: searchParams.sort || 'createdAt_desc',
  }

  const [result, tags, relevanceCounts] = await Promise.all([
    getAdminArticles(params, token).catch(() => ({ data: [], meta: { total: 0, page: 1, totalPages: 1 } })),
    getTagsAdmin(token).catch(() => []),
    getRelevanceCounts(token).catch(() => ({} as Record<number, number>)),
  ])

  const { data: articles, meta } = result as any

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
          Contenido
        </h1>
        <div className="flex items-center gap-2">
          <HomePreviewModal />
          <Link
            href="/admin/contenido/nueva-noticia"
            className="inline-flex items-center gap-2 bg-brand-electric text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
          >
            <Plus size={16} /> Nueva noticia
          </Link>
        </div>
      </div>

      <Suspense>
        <ContentFilters tags={tags} />
      </Suspense>

      <ContentTable articles={articles} token={token} meta={meta} relevanceCounts={relevanceCounts} />
    </div>
  )
}
