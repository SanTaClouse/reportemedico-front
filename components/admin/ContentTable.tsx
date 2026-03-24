'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Globe } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import InlineStatusSelect from '@/components/admin/InlineStatusSelect'
import InlineRelevanceSelect from '@/components/admin/InlineRelevanceSelect'
import DeleteArticleButton from '@/components/admin/DeleteArticleButton'

const typeLabel: Record<string, string> = {
  NEWS: 'Noticia',
  MEDICAL_ARTICLE: 'Art. Médico',
}

interface Props {
  articles: any[]
  token: string
  meta: { total: number; page: number; totalPages: number }
  relevanceCounts?: Record<number, number>
}

export default function ContentTable({ articles, token, meta, relevanceCounts = {} }: Props) {
  const [search, setSearch] = useState('')

  const q = search.toLowerCase()
  const filtered = q
    ? articles.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.authorName?.toLowerCase().includes(q),
      )
    : articles

  return (
    <>
      {/* Búsqueda local */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          {search
            ? `${filtered.length} de ${articles.length} artículo${articles.length !== 1 ? 's' : ''}`
            : `${meta.total} artículo${meta.total !== 1 ? 's' : ''}`}
        </p>
        <input
          type="text"
          placeholder="Buscar en esta página..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
        />
      </div>

      {/* Tabla */}
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[var(--color-text-muted)]">
                  {search ? `Sin resultados para "${search}"` : 'No hay artículos con los filtros seleccionados.'}
                </td>
              </tr>
            ) : (
              filtered.map((article) => (
                <tr
                  key={article.id}
                  className={`hover:bg-[var(--color-surface-2)] transition-colors ${article.status === 'PENDING' ? 'bg-yellow-50/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${article.type === 'NEWS' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
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
                      counts={relevanceCounts}
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
                      {article.status === 'PUBLISHED' ? (
                        <Link
                          href={article.type === 'NEWS' ? `/noticias/${article.slug}` : `/articulos/${article.slug}`}
                          target="_blank"
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                          title="Ver en sitio"
                        >
                          <Globe size={15} strokeWidth={1.5} />
                        </Link>
                      ) : (
                        <span
                          className="text-[var(--color-border)] cursor-not-allowed"
                          title={article.status === 'DRAFT' ? 'Borrador — no publicado' : 'Archivado — no visible'}
                        >
                          <Globe size={15} strokeWidth={1.5} />
                        </span>
                      )}
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
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === meta.page ? 'bg-primary text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-pale)]'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
