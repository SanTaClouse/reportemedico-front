export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getAdminSubscribers, getSubscriberStats, getNewsletterPreview } from '@/lib/api'
import type { Subscriber } from '@/lib/api'
import { Mail, Users, FileText, Rss } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'
import NewsletterSender from './NewsletterSender'

export default async function SuscriptoresPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1', 10)

  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const [subscribersRes, stats, preview] = await Promise.all([
    getAdminSubscribers({ page: String(page), limit: '25' }, token).catch(() => ({
      data: [],
      meta: { total: 0, page: 1, limit: 25, totalPages: 0 },
    })),
    getSubscriberStats(token).catch(() => ({
      total: 0, fromArticles: 0, fromNewsletter: 0, active: 0, unsubscribed: 0,
    })),
    getNewsletterPreview(token).catch(() => ({ articles: [], recipientCount: 0, days: 14 })),
  ])

  const subscribers = subscribersRes.data as Subscriber[]
  const meta = subscribersRes.meta

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
          Futuros Suscriptores
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Emails recopilados desde el formulario de artículos y el botón de suscripción
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={18} strokeWidth={1.5} />}
          value={stats.total}
          label="Total suscriptores"
          color="green"
        />
        <StatCard
          icon={<FileText size={18} strokeWidth={1.5} />}
          value={stats.fromArticles}
          label="Desde artículos"
          color="blue"
        />
        <StatCard
          icon={<Rss size={18} strokeWidth={1.5} />}
          value={stats.fromNewsletter}
          label="Desde newsletter"
          color="teal"
        />
      </div>

      {/* Envío del newsletter */}
      <NewsletterSender initialPreview={preview} token={token} />

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-body font-semibold text-sm text-[var(--color-text-primary)]">
            Lista de suscriptores
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">
            {meta.total} total
          </span>
        </div>

        {subscribers.length === 0 ? (
          <div className="py-16 text-center">
            <Mail size={32} strokeWidth={1} className="mx-auto text-[var(--color-text-muted)] mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">No hay suscriptores aún</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Intereses
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      Registrado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-[var(--color-text-primary)]">
                        {s.email}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--color-text-secondary)]">
                        {s.name ?? <span className="text-[var(--color-text-muted)]">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.source === 'ARTICLE_SUBMISSION' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            <FileText size={10} /> Artículo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Rss size={10} /> Newsletter
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.tags && s.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.tags.slice(0, 3).map(({ tag }) => (
                              <span
                                key={tag.id}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {s.tags.length > 3 && (
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                +{s.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--color-text-muted)] text-xs">
                        {formatDateShort(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="px-5 py-4 border-t border-[var(--color-border)] flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Página {meta.page} de {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={`/admin/suscriptores?page=${page - 1}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      ← Anterior
                    </a>
                  )}
                  {page < meta.totalPages && (
                    <a
                      href={`/admin/suscriptores?page=${page + 1}`}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      Siguiente →
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, value, label, color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'green' | 'blue' | 'teal'
}) {
  const colors = {
    green: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
    blue: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
    teal: { bar: 'bg-teal-500', text: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/10' },
  }
  const c = colors[color]
  return (
    <div className={`relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 ${c.bg}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.bar}`} />
      <div className={`mb-2 ${c.text}`}>{icon}</div>
      <p className="font-bold text-2xl text-[var(--color-text-primary)] leading-none mb-1">{value}</p>
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
    </div>
  )
}
