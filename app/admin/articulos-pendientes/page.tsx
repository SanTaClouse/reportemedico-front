export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import Link from 'next/link'
import { getAdminArticles } from '@/lib/api'
import { formatDateShort } from '@/lib/utils'
import { Clock, Sparkles, Mail } from 'lucide-react'
import SuggestedSpecialtiesReview from '@/components/admin/SuggestedSpecialtiesReview'

export default async function ArticulosPendientesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const result = await getAdminArticles({ status: 'PENDING', limit: '50' }, token).catch(() => ({
    data: [],
    meta: { total: 0 },
  }))

  const { data: articles, meta } = result as any

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Clock size={22} strokeWidth={1.5} className="text-yellow-500" />
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
          Artículos Pendientes
        </h1>
        {meta.total > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
            {meta.total}
          </span>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <Clock size={40} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
          <p>No hay artículos pendientes de revisión.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article: any) => {
            const hasSuggestions =
              Array.isArray(article.suggestedSpecialties) &&
              article.suggestedSpecialties.length > 0

            return (
              <div
                key={article.id}
                className="bg-[var(--color-surface)] border border-yellow-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {article.title}
                      </p>
                      {hasSuggestions && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 shrink-0">
                          <Sparkles size={10} />
                          {article.suggestedSpecialties.length} nueva
                          {article.suggestedSpecialties.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Por <strong>{article.authorName}</strong> ·{' '}
                      Enviado el {formatDateShort(article.createdAt)}
                    </p>
                    {article.authorEmail && (
                      <a
                        href={`mailto:${article.authorEmail}`}
                        className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
                      >
                        <Mail size={12} strokeWidth={1.5} />
                        {article.authorEmail}
                      </a>
                    )}
                    {article.excerpt && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Revisión de especialidades propuestas */}
                    {hasSuggestions && (
                      <SuggestedSpecialtiesReview
                        articleId={article.id}
                        initialSpecialties={article.suggestedSpecialties}
                      />
                    )}
                  </div>
                  <Link
                    href={`/admin/contenido/${article.id}`}
                    className="shrink-0 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Revisar →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
