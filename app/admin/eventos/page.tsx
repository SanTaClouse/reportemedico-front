export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { CalendarDays, ChevronRight } from 'lucide-react'
import AdminLoadError from '@/components/admin/AdminLoadError'
import { formatDate, getEventsAdmin, type AdminEvent } from '@/lib/api-eventos'

export default async function AdminEventosPage() {
  const token = cookies().get('rm_token')?.value || ''
  let events: AdminEvent[] = []
  let error: string | null = null
  try {
    events = await getEventsAdmin(token)
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Eventos</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">Inscripciones, aprobaciones y control de acceso.</p>

      {error ? (
        <div className="mt-6">
          <AdminLoadError what="la lista de eventos" detail={error} />
        </div>
      ) : events.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">No hay eventos cargados.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/eventos/${e.id}`}
                className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-primary/40"
              >
                <CalendarDays size={28} strokeWidth={1.5} className="text-primary shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text-primary)]">{e.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {formatDate(e.dayStartsAt, { day: 'numeric', month: 'long', year: 'numeric' })} · {e.venueName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {e.stats.total} inscritos · <strong>{e.stats.pending} pendientes</strong> · {e.stats.approved} aprobados
                  </p>
                </div>
                <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
