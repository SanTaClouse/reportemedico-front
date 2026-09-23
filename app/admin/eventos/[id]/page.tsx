export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ExternalLink, FileText, Radio, ScanLine } from 'lucide-react'
import {
  SECTOR_LABELS, formatDate, getEventAdmin, getRegistrations, getStaff, type RegistrationList,
} from '@/lib/api-eventos'
import RegistrationsTab from './RegistrationsTab'
import SettingsTab from './SettingsTab'
import StaffTab from './StaffTab'
import TestsTab from './TestsTab'

const TABS = [
  { key: 'inscritos', label: 'Inscritos' },
  { key: 'configuracion', label: 'Configuración' },
  { key: 'personal', label: 'Personal de puerta' },
  { key: 'pruebas', label: 'Pruebas' },
] as const
type Tab = (typeof TABS)[number]['key']

interface Props {
  params: { id: string }
  searchParams: { tab?: string; status?: string; part?: string; sector?: string; q?: string; vip?: string; page?: string }
}

const EMPTY: RegistrationList = { items: [], total: 0, page: 1, limit: 50 }

export default async function AdminEventoPage({ params, searchParams }: Props) {
  const token = cookies().get('rm_token')?.value || ''
  const event = await getEventAdmin(params.id, token).catch(() => null)
  if (!event) notFound()

  const tab: Tab = TABS.some((t) => t.key === searchParams.tab) ? (searchParams.tab as Tab) : 'inscritos'
  const filters = {
    status: searchParams.status ?? '',
    part: searchParams.part ?? '',
    sector: searchParams.sector ?? '',
    q: searchParams.q ?? '',
    vip: searchParams.vip === 'true',
    page: Number(searchParams.page ?? 1) || 1,
  }

  const [registrations, staff, tests] = await Promise.all([
    tab === 'inscritos' ? getRegistrations(event.id, { ...filters, limit: 50 }, token).catch(() => EMPTY) : EMPTY,
    tab === 'personal' ? getStaff(token).catch(() => []) : [],
    tab === 'pruebas' ? getRegistrations(event.id, { tests: true, limit: 50 }, token).catch(() => EMPTY) : EMPTY,
  ])

  const s = event.stats
  const cards = [
    { label: 'Inscritos', value: s.total, sub: `${s.rejected} rechazados` },
    { label: 'Pendientes', value: s.pending, sub: 'por revisar', highlight: s.pending > 0 },
    { label: `Aprobados · ${event.dayTitle}`, value: s.approvedDay, sub: event.dayCapacity ? `de ${event.dayCapacity} de cupo` : '' },
    { label: `Aprobados · ${event.eveningTitle}`, value: s.approvedEvening, sub: event.eveningCapacity ? `de ${event.eveningCapacity} de cupo` : '' },
    { label: 'Ingresaron', value: s.checkedInDay + s.checkedInEvening, sub: `${s.checkedInDay} jornada · ${s.checkedInEvening} gala` },
  ]

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/eventos" className="text-xs text-[var(--color-text-muted)] hover:text-primary">← Eventos</Link>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">{event.name}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {formatDate(event.dayStartsAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {event.venueName}
            {' · '}
            <span className={event.registrationOpen ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
              {event.registrationOpen ? 'Inscripción abierta' : 'Inscripción cerrada'}
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap text-sm">
          {[
            { href: `/eventos/${event.slug}`, label: 'Página pública', icon: ExternalLink },
            { href: `/eventos/${event.slug}/inscripcion`, label: 'Formulario', icon: FileText },
            { href: `/acceso/${event.slug}`, label: 'Escáner', icon: ScanLine },
            { href: `/acceso/${event.slug}/en-vivo`, label: 'En vivo', icon: Radio },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-medium text-[var(--color-text-secondary)] hover:border-primary/40 hover:text-primary"
            >
              <Icon size={15} strokeWidth={1.5} /> {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-xl border p-4 bg-[var(--color-surface)] ${
              c.highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-[var(--color-border)]'
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)] leading-tight">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-[var(--color-text-primary)]">{c.value}</p>
            {c.sub && <p className="text-xs text-[var(--color-text-muted)]">{c.sub}</p>}
          </div>
        ))}
      </div>

      {s.bySector.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.bySector.map((b) => (
            <span
              key={b.sector}
              className="rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
            >
              {SECTOR_LABELS[b.sector]}: <strong>{b.count}</strong>
            </span>
          ))}
        </div>
      )}

      <nav className="mt-6 flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/eventos/${event.id}${t.key === 'inscritos' ? '' : `?tab=${t.key}`}`}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        {tab === 'inscritos' && (
          <RegistrationsTab event={event} list={registrations} filters={filters} token={token} />
        )}
        {tab === 'configuracion' && <SettingsTab event={event} token={token} />}
        {tab === 'personal' && <StaffTab staff={staff} token={token} />}
        {tab === 'pruebas' && <TestsTab event={event} tests={tests.items} token={token} />}
      </div>
    </div>
  )
}
