export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import Link from 'next/link'
import { getAdminArticles, getTags } from '@/lib/api'
import { formatDateShort } from '@/lib/utils'
import { Plus, Eye, Pencil, Globe } from 'lucide-react'
import InlineStatusSelect from '@/components/admin/InlineStatusSelect'
import InlineRelevanceSelect from '@/components/admin/InlineRelevanceSelect'
import DeleteArticleButton from '@/components/admin/DeleteArticleButton'
import ContentFilters from '@/components/admin/ContentFilters'

interface Props {
  searchParams: {
    page?: string
    type?: string
    status?: string
    relevance?: string
    tag?: string
    search?: string
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
    ...(searchParams.search && { search: searchParams.search }),
    sort: searchParams.sort || 'createdAt_desc',
  }

  const [result, tags] = await Promise.all([
    getAdminArticles(params, token).catch(() => ({ data: [], meta: { total: 0, page: 1, totalPages: 1 } })),
    getTags().catch(() => []),
  ])

  const { data: articles, meta } = result as any

  const typeLabel: Record<string, string> = {
    NEWS: 'Noticia',
    MEDICAL_ARTICLE: 'Art. Médico',
  }
  const statusLabel: Record<string, string> = {
    DRAFT: 'Borrador',
    PENDING: 'Pendiente',
    PUBLISHED: 'Publicado',
    ARCHIVED: 'Archivado',
  }
  const statusColor: Record<string, string> = {
    DRAFT: 'text-gray-500',
    PENDING: 'text-yellow-600',
    PUBLISHED: 'text-green-600',
    ARCHIVED: 'text-red-500',
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
          Contenido
        </h1>
        <Link
          href="/admin/contenido/nueva-noticia"
          className="inline-flex items-center gap-2 bg-brand-electric text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus size={16} /> Nueva noticia
        </Link>
      </div>

      <ContentFilters tags={tags} />

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Título</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden md:table-cell">Autor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden lg:table-cell">Relevancia</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden lg:table-cell">Vistas</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {articles.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[var(--color-text-muted)]">
                  No hay artículos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              articles.map((article: any) => (
                <tr
                  key={article.id}
                  className={`hover:bg-[var(--color-surface-2)] transition-colors ${article.status === 'PENDING' ? 'bg-yellow-50/50' : ''
                    }`}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${article.type === 'NEWS'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                      }`}>
                      {typeLabel[article.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <Link
                      href={`/admin/contenido/${article.id}`}
                      className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)] line-clamp-1 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell">
                    {article.authorName}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <InlineRelevanceSelect
                      articleId={article.id}
                      currentRelevance={article.relevance}
                      token={token}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <InlineStatusSelect
                      articleId={article.id}
                      currentStatus={article.status}
                      token={token}
                    />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden lg:table-cell">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {article.viewsCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell text-xs">
                    {formatDateShort(article.publishedAt || article.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/contenido/${article.id}`}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} strokeWidth={1.5} />
                      </Link>
                      <Link
                        href={article.type === 'NEWS' ? `/noticias/${article.slug}` : `/articulos/${article.slug}`}
                        target="_blank"
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Ver en sitio"
                      >
                        <Globe size={15} strokeWidth={1.5} />
                      </Link>
                      <DeleteArticleButton articleId={article.id} token={token} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/contenido?page=${p}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === meta.page
                ? 'bg-primary text-white'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-pale)]'
                }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
