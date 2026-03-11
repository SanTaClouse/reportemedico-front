export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getAdminArticles } from '@/lib/api'
import { FileText, Clock, BookOpen, Mic } from 'lucide-react'
import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'

async function getStats(token: string) {
  const [published, pending, allArticles] = await Promise.all([
    getAdminArticles({ status: 'PUBLISHED', limit: '1' }, token).catch(() => ({ meta: { total: 0 } })),
    getAdminArticles({ status: 'PENDING', limit: '5' }, token).catch(() => ({ data: [], meta: { total: 0 } })),
    getAdminArticles({ limit: '5', sort: 'createdAt_desc' }, token).catch(() => ({ data: [] })),
  ])
  return { published, pending, allArticles }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const { published, pending, allArticles } = await getStats(token)
  const pendingCount = (pending as any).meta?.total || 0
  const pendingArticles = (pending as any).data || []
  const latestArticles = (allArticles as any).data || []
  const publishedCount = (published as any).meta?.total || 0

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-6">
        Dashboard
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Publicados"
          value={publishedCount}
          icon={<FileText size={20} strokeWidth={1.5} />}
        />
        <StatCard
          label="Pendientes"
          value={pendingCount}
          icon={<Clock size={20} strokeWidth={1.5} />}
          alert={pendingCount > 0}
          href="/admin/articulos-pendientes"
        />
        <StatCard
          label="Ediciones"
          value="—"
          icon={<BookOpen size={20} strokeWidth={1.5} />}
          href="/admin/ediciones"
        />
        <StatCard
          label="Podcast"
          value="—"
          icon={<Mic size={20} strokeWidth={1.5} />}
          href="/admin/podcast"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendientes */}
        {pendingCount > 0 && (
          <section className="bg-[var(--color-surface)] border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-body font-semibold text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">
                Pendientes de revisión
              </h2>
              <Link href="/admin/articulos-pendientes" className="text-xs text-[var(--color-primary)] hover:underline">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-2">
              {pendingArticles.slice(0, 5).map((a: any) => (
                <Link
                  key={a.id}
                  href={`/admin/contenido/${a.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors group"
                >
                  <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)]">
                      {a.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Por {a.authorName} · {formatDateShort(a.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Últimos artículos */}
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-body font-semibold text-sm text-[var(--color-text-secondary)] uppercase tracking-wide">
              Últimos artículos
            </h2>
            <Link href="/admin/contenido" className="text-xs text-[var(--color-primary)] hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {latestArticles.slice(0, 5).map((a: any) => (
              <Link
                key={a.id}
                href={`/admin/contenido/${a.id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors group"
              >
                <StatusDot status={a.status} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)]">
                    {a.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {a.status} · {formatDateShort(a.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  alert,
  href,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  alert?: boolean
  href?: string
}) {
  const content = (
    <div className={`bg-[var(--color-surface)] border rounded-xl p-5 ${alert ? 'border-yellow-300 bg-yellow-50' : 'border-[var(--color-border)]'}`}>
      <div className={`mb-3 ${alert ? 'text-yellow-600' : 'text-[var(--color-primary)]'}`}>
        {icon}
      </div>
      <p className={`font-bold text-3xl mb-1 ${alert ? 'text-yellow-700' : 'text-[var(--color-text-primary)]'}`}>
        {value}
        {alert && <span className="ml-1 text-sm">🔴</span>}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
    </div>
  )

  if (href) {
    return <Link href={href} className="block hover:scale-[1.02] transition-transform">{content}</Link>
  }
  return content
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PUBLISHED: 'bg-green-500',
    DRAFT: 'bg-gray-400',
    PENDING: 'bg-yellow-400',
    ARCHIVED: 'bg-red-400',
  }
  return <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors[status] || 'bg-gray-400'}`} />
}
