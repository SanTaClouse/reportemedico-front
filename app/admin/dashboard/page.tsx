export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import {
  getAdminArticles,
  getAdminPrintEditions,
  getAdminPodcastEpisodes,
  getHomeData,
} from '@/lib/api'
import {
  FileText, Clock, BookOpen, Mic, Plus,
  CheckCircle2, PenLine, AlertCircle, Archive,
  Newspaper, ExternalLink, TrendingUp,
} from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

// ── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData(token: string) {
  const [published, drafts, pending, latest, editions, podcasts, home] = await Promise.all([
    getAdminArticles({ status: 'PUBLISHED', limit: '1' }, token).catch(() => ({ meta: { total: 0 } })),
    getAdminArticles({ status: 'DRAFT', limit: '1' }, token).catch(() => ({ meta: { total: 0 } })),
    getAdminArticles({ status: 'PENDING', limit: '5' }, token).catch(() => ({ data: [], meta: { total: 0 } })),
    getAdminArticles({ limit: '6', sort: 'createdAt_desc' }, token).catch(() => ({ data: [] })),
    getAdminPrintEditions(token).catch(() => []),
    getAdminPodcastEpisodes(token).catch(() => []),
    getHomeData().catch(() => null),
  ])
  return { published, drafts, pending, latest, editions, podcasts, home }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ES: Record<string, string> = {
  PUBLISHED: 'Publicado', DRAFT: 'Borrador',
  PENDING: 'Pendiente', ARCHIVED: 'Archivado',
}
const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ARCHIVED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatDay() {
  return new Date().toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const { published, drafts, pending, latest, editions, podcasts, home } = await getDashboardData(token)

  const publishedCount = (published as any).meta?.total ?? 0
  const draftsCount = (drafts as any).meta?.total ?? 0
  const pendingCount = (pending as any).meta?.total ?? 0
  const pendingList = (pending as any).data ?? []
  const latestList = (latest as any).data ?? []
  const editionsCount = Array.isArray(editions) ? editions.length : 0
  const podcastList = Array.isArray(podcasts) ? podcasts : []
  const podcastCount = podcastList.length
  const featuredPodcast = podcastList[0] ?? null
  const hero = (home as any)?.hero ?? null
  const lead = (home as any)?.lead ?? null

  return (
    <div className="p-6 md:p-8 max-w-6xl space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest mb-1 capitalize">
            {formatDay()}
          </p>
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
            {greeting()} 👋
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Panel de administración · Reporte Médico
          </p>
        </div>
        <Link
          href="/admin/contenido/nueva-noticia"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-primary-light transition-colors shadow-sm shrink-0"
        >
          <Plus size={17} /> Nueva noticia
        </Link>
      </div>

      {/* ── Acciones rápidas ── */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/contenido/nueva-noticia', label: 'Nueva noticia', icon: Newspaper, primary: true },
            { href: '/admin/podcast', label: 'Nuevo episodio', icon: Mic },
            { href: '/admin/ediciones', label: 'Nueva edición', icon: BookOpen },
            {
              href: '/admin/articulos-pendientes', label: 'Pendientes', icon: Clock,
              badge: pendingCount > 0 ? pendingCount : undefined
            },
          ].map(({ href, label, icon: Icon, primary, badge }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:shadow-sm ${primary
                ? 'bg-primary text-white border-primary hover:bg-primary-light'
                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                }`}
            >
              <Icon size={17} strokeWidth={1.5} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
          Resumen
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard icon={<TrendingUp size={18} strokeWidth={1.5} />} value={publishedCount} label="Publicados" color="green" href="/admin/contenido?status=PUBLISHED" />
          <StatCard icon={<PenLine size={18} strokeWidth={1.5} />} value={draftsCount} label="Borradores" color="gray" href="/admin/contenido?status=DRAFT" />
          <StatCard icon={<AlertCircle size={18} strokeWidth={1.5} />} value={pendingCount} label="Pendientes" color={pendingCount > 0 ? 'yellow' : 'gray'} href="/admin/articulos-pendientes" alert={pendingCount > 0} />
          <StatCard icon={<Mic size={18} strokeWidth={1.5} />} value={podcastCount} label="Episodios" color="teal" href="/admin/podcast" />
          <StatCard icon={<BookOpen size={18} strokeWidth={1.5} />} value={editionsCount} label="Ediciones" color="blue" href="/admin/ediciones" />
        </div>
      </section>

      {/* ── Contenido ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pendientes */}
        {pendingCount > 0 && (
          <section className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
            <SectionHeader
              title="Pendientes de revisión"
              badge={pendingCount}
              badgeColor="bg-yellow-400 text-yellow-900"
              href="/admin/articulos-pendientes"
            />
            <div className="space-y-1 mt-4">
              {pendingList.slice(0, 5).map((a: any) => (
                <ArticleRow key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* Últimos artículos */}
        <section className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 ${pendingCount === 0 ? 'lg:col-span-2' : ''}`}>
          <SectionHeader title="Últimos artículos" href="/admin/contenido" />
          <div className="space-y-1 mt-4">
            {latestList.slice(0, pendingCount > 0 ? 6 : 8).map((a: any) => (
              <ArticleRow key={a.id} article={a} showStatus />
            ))}
          </div>
        </section>
      </div>

      {/* ── Estado editorial ── */}
      {(hero || lead || featuredPodcast) && (
        <section>
          <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
            Lo que ven los lectores ahora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {hero && (
              <EditorialCard
                label="Hero principal"
                labelColor="bg-primary text-white"
                href={`/admin/contenido/${hero.id}`}
                image={hero.featuredImage}
                title={hero.title}
                meta={`Por ${hero.authorName}`}
                publicHref={`/noticias/${hero.slug}`}
              />
            )}

            {lead && (
              <EditorialCard
                label="Destacado lead"
                labelColor="bg-[var(--brand-navy)] text-white"
                href={`/admin/contenido/${lead.id}`}
                image={lead.featuredImage}
                title={lead.title}
                meta={`Por ${lead.authorName}`}
                publicHref={`/noticias/${lead.slug}`}
              />
            )}

            {featuredPodcast && (
              <EditorialCard
                label="Podcast destacado"
                labelColor="bg-red-600 text-white"
                href="/admin/podcast"
                image={featuredPodcast.thumbnailUrl || `https://img.youtube.com/vi/${featuredPodcast.youtubeId}/mqdefault.jpg`}
                title={featuredPodcast.title}
                meta="Episodio #1 en el inicio"
                publicHref="/podcast"
              />
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color, href, alert }: {
  icon: React.ReactNode; value: number; label: string
  color: 'green' | 'gray' | 'yellow' | 'teal' | 'blue'
  href?: string; alert?: boolean
}) {
  const colors = {
    green: { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
    gray: { bar: 'bg-gray-400', text: 'text-gray-500', bg: '' },
    yellow: { bar: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
    teal: { bar: 'bg-teal-500', text: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/10' },
    blue: { bar: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
  }
  const c = colors[color]
  const inner = (
    <div className={`relative overflow-hidden bg-[var(--color-surface)] border rounded-xl p-4 h-full ${alert ? 'border-yellow-300' : 'border-[var(--color-border)]'} ${c.bg}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.bar}`} />
      <div className={`mb-2 ${c.text}`}>{icon}</div>
      <p className="font-bold text-2xl text-[var(--color-text-primary)] leading-none mb-1">
        {value}
        {alert && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-red-500 mb-0.5" />}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
    </div>
  )
  if (href) return <Link href={href} className="block hover:scale-[1.02] transition-transform h-full">{inner}</Link>
  return inner
}

function SectionHeader({ title, badge, badgeColor, href }: {
  title: string; badge?: number; badgeColor?: string; href: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="font-body font-semibold text-sm text-[var(--color-text-primary)]">{title}</h2>
        {badge !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
        )}
      </div>
      <Link href={href} className="text-xs text-[var(--color-primary)] hover:underline shrink-0">Ver todos →</Link>
    </div>
  )
}

function ArticleRow({ article: a, showStatus }: { article: any; showStatus?: boolean }) {
  return (
    <Link
      href={`/admin/contenido/${a.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors group"
    >
      {a.featuredImage ? (
        <div className="w-10 h-7 rounded overflow-hidden shrink-0 bg-[var(--color-surface-2)]">
          <Image src={a.featuredImage} alt="" width={40} height={28} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-7 rounded shrink-0 bg-[var(--color-surface-2)] flex items-center justify-center">
          <FileText size={13} className="text-[var(--color-text-muted)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors leading-snug">
          {a.title}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {a.authorName} · {formatDateShort(a.createdAt)}
        </p>
      </div>
      {showStatus && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[a.status] ?? STATUS_COLOR.DRAFT}`}>
          {STATUS_ES[a.status] ?? a.status}
        </span>
      )}
    </Link>
  )
}

function EditorialCard({ label, labelColor, href, image, title, meta, publicHref }: {
  label: string; labelColor: string; href: string
  image?: string | null; title: string; meta: string; publicHref: string
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      {/* Image */}
      <div className="relative aspect-video bg-[var(--color-surface-2)]">
        {image ? (
          <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
            <FileText size={28} strokeWidth={1} />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${labelColor}`}>
          {label}
        </span>
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug mb-1">
          {title}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">{meta}</p>
        <div className="flex items-center gap-2">
          <Link href={href} className="flex-1 text-center text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors">
            Editar
          </Link>
          <Link href={publicHref} target="_blank" className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline px-2 py-1.5">
            Ver <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}
