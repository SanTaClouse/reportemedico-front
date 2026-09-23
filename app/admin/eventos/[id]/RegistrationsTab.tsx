'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Check, Download, Loader2, Mail, MailCheck, MessageCircle, Phone, QrCode, RotateCcw, Search, Star, Trash2, X,
} from 'lucide-react'
import {
  SECTOR_LABELS, STATUS_LABELS, attendanceLabel, deleteRegistration, getRegistrations, resendAccess,
  setRegistrationStatus, updateRegistration, waNumber,
  type AdminEvent, type EventSector, type RegistrationList, type RegistrationRow, type RegistrationStatus,
} from '@/lib/api-eventos'

interface Filters {
  status: string
  part: string
  sector: string
  q: string
  vip: boolean
  page: number
}

const STATUS_STYLE: Record<RegistrationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
}

const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`

/** La del catálogo, o la que escribió a mano si eligió "Otra" */
const especialidad = (r: RegistrationRow) => r.specialty?.name ?? r.specialtyOther ?? null
const fecha = (d: string) =>
  new Date(d).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'short', timeStyle: 'short' })

function toCsv(event: AdminEvent, rows: RegistrationRow[]) {
  const head = [
    'Nombre', 'Apellido', 'Email', 'WhatsApp', 'Sector', 'Especialidad', 'Institucion', 'Cargo', 'Asiste a',
    'Estado', 'VIP', 'Medico de la guia', 'Inscrito', 'Ingreso jornada', 'Ingreso gala',
  ]
  const lines = rows.map((r) => {
    const day = r.checkIns.find((c) => c.part === 'DAY')
    const eve = r.checkIns.find((c) => c.part === 'EVENING')
    return [
      r.firstName, r.lastName, r.email, r.phone, SECTOR_LABELS[r.sector], especialidad(r) ?? '',
      r.institution ?? '', r.position ?? '', attendanceLabel(event, r.attendance), STATUS_LABELS[r.status],
      r.isVip ? 'Si' : '', r.doctor ? 'Si' : '', fecha(r.createdAt), day ? fecha(day.createdAt) : '',
      eve ? fecha(eve.createdAt) : '',
    ].map(esc).join(',')
  })
  return [head.map(esc).join(','), ...lines].join('\n')
}

function download(csv: string, name: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM: acentos en Excel
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RegistrationsTab({
  event, list, filters, token,
}: {
  event: AdminEvent
  list: RegistrationList
  filters: Filters
  token: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(filters.q)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(list.total / list.limit))
  const s = event.stats

  const navigate = (patch: Partial<Record<keyof Filters, string>>) => {
    const merged = {
      status: filters.status, part: filters.part, sector: filters.sector, q,
      vip: filters.vip ? 'true' : '', page: '1', ...patch,
    }
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'page' && v === '1')) qs.set(k, v)
    setSelected(new Set())
    router.push(`/admin/eventos/${event.id}${qs.size ? `?${qs}` : ''}`)
  }

  const run = async (key: string, fn: () => Promise<void>) => {
    setWorking(key)
    try {
      await fn()
      router.refresh()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setWorking(null)
    }
  }

  const changeStatus = (ids: string[], status: RegistrationStatus) =>
    run(`status-${status}-${ids.join()}`, async () => {
      const res = await setRegistrationStatus(event.id, ids, status, token)
      setSelected(new Set())
      if (status === 'APPROVED') {
        toast.success(
          `${res.updated} aprobada${res.updated === 1 ? '' : 's'}` +
            (res.notifying ? ` · enviando ${res.notifying} email${res.notifying === 1 ? '' : 's'} en segundo plano` : ''),
        )
      } else {
        toast.success(`${res.updated} actualizada${res.updated === 1 ? '' : 's'}${status === 'REJECTED' ? ' (sin aviso a la persona)' : ''}`)
      }
    })

  const exportCsv = () =>
    run('csv', async () => {
      const all = await getRegistrations(event.id, { ...filters, page: 1, limit: 5000 }, token)
      download(toCsv(event, all.items), `inscritos-${event.slug}`)
    })

  const allOnPage = list.items.length > 0 && list.items.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected(allOnPage ? new Set() : new Set(list.items.map((r) => r.id)))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active ? 'bg-primary text-white border-primary' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
    }`
  const selectClass =
    'px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]'
  const th = 'px-3 py-2 font-semibold'
  const td = 'px-3 py-2.5 align-top'

  return (
    <div>
      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: '', label: `Todas (${s.total})` },
          { value: 'PENDING', label: `Pendientes (${s.pending})` },
          { value: 'APPROVED', label: `Aprobadas (${s.approved})` },
          { value: 'REJECTED', label: `Rechazadas (${s.rejected})` },
        ].map((f) => (
          <button key={f.value} onClick={() => navigate({ status: f.value })} className={chip(filters.status === f.value)}>
            {f.label}
          </button>
        ))}
        <button onClick={() => navigate({ vip: filters.vip ? '' : 'true' })} className={chip(filters.vip)}>
          <Star size={11} className="inline -mt-0.5 mr-1" /> VIP
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <select value={filters.part} onChange={(e) => navigate({ part: e.target.value })} className={selectClass}>
          <option value="">Todas las partes</option>
          <option value="DAY">{event.dayTitle}</option>
          <option value="EVENING">{event.eveningTitle}</option>
        </select>
        <select value={filters.sector} onChange={(e) => navigate({ sector: e.target.value })} className={selectClass}>
          <option value="">Todos los sectores</option>
          {(Object.keys(SECTOR_LABELS) as EventSector[]).map((k) => (
            <option key={k} value={k}>{SECTOR_LABELS[k]}</option>
          ))}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); navigate({}) }} className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono o institución..."
            className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
          />
        </form>
        <button
          onClick={exportCsv}
          disabled={list.total === 0 || working === 'csv'}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40"
        >
          {working === 'csv' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Exportar CSV
        </button>
      </div>

      {/* Acciones en lote */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mt-3 flex items-center gap-2 flex-wrap rounded-xl bg-primary px-4 py-2.5 text-sm text-white shadow">
          <strong>{selected.size} seleccionada{selected.size === 1 ? '' : 's'}</strong>
          <span className="flex-1" />
          <button onClick={() => changeStatus([...selected], 'APPROVED')} disabled={!!working}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold hover:bg-emerald-400 disabled:opacity-50">
            Aprobar
          </button>
          <button onClick={() => changeStatus([...selected], 'REJECTED')} disabled={!!working}
            className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25 disabled:opacity-50">
            Rechazar
          </button>
          <button onClick={() => changeStatus([...selected], 'PENDING')} disabled={!!working}
            className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25 disabled:opacity-50">
            Volver a pendiente
          </button>
          <button onClick={() => setSelected(new Set())} className="rounded-lg px-2 py-1.5 hover:bg-white/15" aria-label="Quitar selección">
            <X size={16} />
          </button>
        </div>
      )}

      {list.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">No hay inscripciones con este filtro.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-left">
              <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="px-3 py-2 w-8">
                  <input type="checkbox" checked={allOnPage} onChange={toggleAll} aria-label="Seleccionar todas" />
                </th>
                <th className={th}>Persona</th>
                <th className={th}>Contacto</th>
                <th className={th}>Sector</th>
                <th className={th}>Asiste a</th>
                <th className={th}>Estado</th>
                <th className={th}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {list.items.map((r) => {
                const wa = waNumber(r.phone)
                return (
                  <tr key={r.id} className={selected.has(r.id) ? 'bg-primary-pale' : 'hover:bg-[var(--color-surface-2)]/50'}>
                    <td className={td}>
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Seleccionar a ${r.firstName}`} />
                    </td>
                    <td className={td}>
                      <div className="flex items-start gap-1.5">
                        <button
                          onClick={() => run(`vip-${r.id}`, async () => { await updateRegistration(event.id, r.id, { isVip: !r.isVip }, token) })}
                          title={r.isVip ? 'Quitar VIP' : 'Marcar como VIP (aviso en la vista en vivo)'}
                          className={r.isVip ? 'text-brand-gold' : 'text-[var(--color-text-muted)] opacity-40 hover:opacity-100'}
                        >
                          <Star size={15} fill={r.isVip ? 'currentColor' : 'none'} />
                        </button>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{r.firstName} {r.lastName}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">
                            {fecha(r.createdAt)}
                            {r.doctor && (
                              <>
                                {' · '}
                                <Link href={`/admin/guia-medica/medicos/${r.doctor.id}`} className="font-semibold text-primary hover:underline">
                                  en la guía
                                </Link>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex items-center gap-2">
                        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" title="Abrir WhatsApp"
                          className="inline-flex items-center gap-1 font-medium text-[var(--color-text-primary)] hover:text-emerald-600">
                          <MessageCircle size={13} className="text-emerald-600" /> {r.phone}
                        </a>
                        <a href={`tel:+${wa}`} title="Llamar" className="text-[var(--color-text-muted)] hover:text-primary">
                          <Phone size={13} />
                        </a>
                      </div>
                      <a href={`mailto:${r.email}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-primary">
                        <Mail size={12} /> {r.email}
                      </a>
                    </td>
                    <td className={`${td} text-xs`}>
                      <p className="text-[var(--color-text-primary)]">
                        {SECTOR_LABELS[r.sector]}
                        {especialidad(r) ? ` · ${especialidad(r)}` : ''}
                        {!r.specialty && r.specialtyOther && (
                          <span className="ml-1 text-[10px] uppercase text-[var(--color-text-muted)]">(escrita)</span>
                        )}
                      </p>
                      {(r.institution || r.position) && (
                        <p className="text-[var(--color-text-muted)]">{[r.institution, r.position].filter(Boolean).join(' · ')}</p>
                      )}
                    </td>
                    <td className={`${td} text-xs text-[var(--color-text-secondary)]`}>
                      {attendanceLabel(event, r.attendance)}
                      {r.checkIns.length > 0 && (
                        <p className="mt-0.5 font-semibold text-emerald-700">
                          Ingresó: {r.checkIns.map((c) => (c.part === 'DAY' ? 'jornada' : 'gala')).join(' y ')}
                        </p>
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                      {r.status === 'APPROVED' && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                          {r.qrEmailSentAt ? (
                            <>
                              <QrCode size={11} /> QR enviado
                              {r.remindersSent.length > 0 && ` · ${r.remindersSent.length} recordatorio${r.remindersSent.length === 1 ? '' : 's'}`}
                            </>
                          ) : (
                            <><MailCheck size={11} /> Enviando el QR…</>
                          )}
                        </p>
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex items-center gap-1">
                        {r.status !== 'APPROVED' && (
                          <button onClick={() => changeStatus([r.id], 'APPROVED')} disabled={!!working} title="Aprobar"
                            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
                            <Check size={16} />
                          </button>
                        )}
                        {r.status !== 'REJECTED' && (
                          <button onClick={() => changeStatus([r.id], 'REJECTED')} disabled={!!working} title="Rechazar (no se le avisa)"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40">
                            <X size={16} />
                          </button>
                        )}
                        {r.status === 'REJECTED' && (
                          <button onClick={() => changeStatus([r.id], 'PENDING')} disabled={!!working} title="Volver a pendiente"
                            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-40">
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {r.status === 'APPROVED' && (
                          <button
                            onClick={() => run(`qr-${r.id}`, async () => {
                              const res = await resendAccess(event.id, r.id, token)
                              if (!res.smtp) toast.warning('SMTP no configurado: el email no salió (modo local).')
                              else if (res.sent) toast.success(`QR reenviado a ${r.email}`)
                              else toast.error('No se pudo enviar el email')
                            })}
                            disabled={!!working}
                            title="Enviar / reenviar el QR ahora"
                            className="rounded-lg p-1.5 text-primary hover:bg-primary-pale disabled:opacity-40"
                          >
                            {working === `qr-${r.id}` ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (!confirm(`¿Borrar la inscripción de ${r.firstName} ${r.lastName}? No se puede deshacer.`)) return
                            void run(`del-${r.id}`, async () => { await deleteRegistration(event.id, r.id, token) })
                          }}
                          disabled={!!working}
                          title="Borrar (spam o duplicado)"
                          className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-5" aria-label="Paginación">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => navigate({ page: String(p) })}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                p === list.page ? 'bg-primary text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {p}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
