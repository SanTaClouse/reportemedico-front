'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Search, Download, Phone, MessageCircle, Mail, ExternalLink, PhoneOff, Clock } from 'lucide-react'
import {
  DOCTOR_STATUS_LABELS, PLAN_LABELS,
  type DoctorListResponse, type Doctor, type LeadRow,
} from '@/lib/api-guia'
import { waNumber } from '@/lib/utils'

interface LeadListResponse {
  items: LeadRow[]
  total: number
  page: number
  limit: number
}

const PLAN_FILTERS: { value: string; label: string }[] = [
  { value: 'BASIC', label: 'Básicos (a vender)' },
  { value: 'STANDARD', label: 'Estándar' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'ALL', label: 'Todos' },
]

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Cualquier estado' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'DRAFT', label: 'Borradores' },
]

/** El teléfono de ventas es el interno; si no está, se cae al público / consultorio */
function salesPhone(d: Doctor): { number: string; source: string } | null {
  if (d.phoneInternal) return { number: d.phoneInternal, source: 'contacto' }
  if (d.phonePublic) return { number: d.phonePublic, source: 'WhatsApp' }
  if (d.phoneOffice) return { number: d.phoneOffice, source: 'consultorio' }
  return null
}

const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
const fecha = (d: string) => new Date(d).toLocaleDateString('es-DO')

function leadsCsv(items: LeadRow[]): string {
  const head = ['Nombre', 'Apellido', 'Telefono', 'Email', 'Especialidad', 'Plan de interes', 'Fecha']
  const rows = items.map((l) =>
    [l.firstName, l.lastName, l.phone, l.email, l.specialty?.name ?? '', PLAN_LABELS[l.interestPlan ?? 'BASIC'], fecha(l.createdAt)]
      .map((v) => esc(String(v ?? ''))).join(','),
  )
  return [head.map(esc).join(','), ...rows].join('\n')
}

function doctorsCsv(items: Doctor[]): string {
  const head = ['Nombre', 'Apellido', 'Telefono', 'Origen telefono', 'Email', 'Especialidades', 'Ciudad', 'Plan', 'Estado', 'Alta']
  const rows = items.map((d) => {
    const p = salesPhone(d)
    return [
      d.firstName, d.lastName, p?.number ?? '', p?.source ?? 'SIN TELEFONO', d.email ?? '',
      d.specialties.map((s) => s.specialty.name).join(' / '),
      [...new Set(d.clinics.map((c) => c.clinic.city?.name).filter(Boolean))].join(' / '),
      PLAN_LABELS[d.plan], DOCTOR_STATUS_LABELS[d.status], fecha(d.createdAt),
    ].map((v) => esc(String(v ?? ''))).join(',')
  })
  return [head.map(esc).join(','), ...rows].join('\n')
}

function download(csv: string, name: string) {
  // BOM para que Excel no rompa los acentos
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LeadsClient({
  view, leads, doctors, plan, status,
}: {
  view: 'leads' | 'doctors'
  leads: LeadListResponse
  doctors: DoctorListResponse
  plan: string
  status: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const current = view === 'leads' ? leads : doctors
  const totalPages = Math.max(1, Math.ceil(current.total / current.limit))

  const navigate = (params: Record<string, string>) => {
    const qs = new URLSearchParams()
    const merged = { view, plan, status, search, page: '1', ...params }
    if (merged.view !== 'leads') qs.set('view', merged.view)
    if (merged.view === 'doctors') {
      if (merged.plan && merged.plan !== 'BASIC') qs.set('plan', merged.plan)
      if (merged.status) qs.set('status', merged.status)
      if (merged.search) qs.set('search', merged.search)
    }
    if (merged.page !== '1') qs.set('page', merged.page)
    router.push(`/admin/guia-medica/leads${qs.size ? `?${qs}` : ''}`)
  }

  const thClass = 'px-3 py-2 font-semibold'
  const tdClass = 'px-3 py-2.5'

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          Leads de ventas
        </h1>
        <button
          onClick={() =>
            view === 'leads'
              ? download(leadsCsv(leads.items), 'leads-nuevos')
              : download(doctorsCsv(doctors.items), `medicos-${plan.toLowerCase()}`)
          }
          disabled={current.items.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Pestañas: los leads sin convertir van primero, son los más valiosos */}
      <div className="flex items-center gap-1 mt-4 mb-4 border-b border-[var(--color-border)]">
        {([
          { key: 'leads', label: 'Leads nuevos', count: leads.total },
          { key: 'doctors', label: 'Médicos registrados', count: doctors.total },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => navigate({ view: t.key })}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              view === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {t.label}
            {view === t.key && ` (${t.count})`}
          </button>
        ))}
      </div>

      {view === 'leads' ? (
        <>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Dejaron sus datos pero <strong>no terminaron de crear la cuenta</strong>. Son los más
            urgentes: sin este listado se pierden.
          </p>

          {leads.items.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-10 text-center">
              No hay leads sin convertir.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-2)] text-left">
                  <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <th className={thClass}>Contacto</th>
                    <th className={thClass}>Teléfono</th>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Especialidad</th>
                    <th className={thClass}>Interés</th>
                    <th className={thClass}>Dejó los datos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {leads.items.map((l) => (
                    <tr key={l.id} className="hover:bg-[var(--color-surface-2)]/50">
                      <td className={`${tdClass} font-medium text-[var(--color-text-primary)]`}>
                        {l.firstName} {l.lastName}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        <span className="inline-flex items-center gap-2">
                          <a
                            href={`tel:+${waNumber(l.phone)}`}
                            className="font-medium text-[var(--color-text-primary)] hover:text-primary inline-flex items-center gap-1"
                          >
                            <Phone size={12} /> {l.phone}
                          </a>
                          <a
                            href={`https://wa.me/${waNumber(l.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir WhatsApp"
                            className="text-emerald-600 hover:opacity-70"
                          >
                            <MessageCircle size={13} />
                          </a>
                        </span>
                      </td>
                      <td className={tdClass}>
                        <a
                          href={`mailto:${l.email}`}
                          className="text-[var(--color-text-secondary)] hover:text-primary inline-flex items-center gap-1 text-xs"
                        >
                          <Mail size={12} /> {l.email}
                        </a>
                      </td>
                      <td className={`${tdClass} text-xs text-[var(--color-text-secondary)]`}>
                        {l.specialty?.name ?? '—'}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {l.interestPlan && l.interestPlan !== 'BASIC' ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-gold/15 text-amber-700">
                            {PLAN_LABELS[l.interestPlan]}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)]">Básica</span>
                        )}
                      </td>
                      <td className={`${tdClass} text-xs text-[var(--color-text-muted)] whitespace-nowrap`}>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} /> {fecha(l.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {PLAN_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => navigate({ plan: value })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  plan === value
                    ? 'bg-primary text-white border-primary'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <select
              value={status}
              onChange={(e) => navigate({ status: e.target.value })}
              className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
            >
              {STATUS_FILTERS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <form
              onSubmit={(e) => { e.preventDefault(); navigate({}) }}
              className="relative flex-1 min-w-[200px]"
            >
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o exequátur..."
                className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
              />
            </form>
          </div>

          {doctors.items.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-10 text-center">
              No hay médicos con este filtro.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-2)] text-left">
                  <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    <th className={thClass}>Médico</th>
                    <th className={thClass}>Teléfono</th>
                    <th className={thClass}>Email</th>
                    <th className={thClass}>Especialidad</th>
                    <th className={thClass}>Alta</th>
                    <th className={thClass}>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {doctors.items.map((d) => {
                    const phone = salesPhone(d)
                    return (
                      <tr key={d.id} className="hover:bg-[var(--color-surface-2)]/50">
                        <td className={tdClass}>
                          <Link
                            href={`/admin/guia-medica/medicos/${d.id}`}
                            className="font-medium text-[var(--color-text-primary)] hover:text-primary inline-flex items-center gap-1"
                          >
                            {d.title} {d.firstName} {d.lastName}
                            <ExternalLink size={11} className="opacity-50" />
                          </Link>
                          {plan === 'ALL' && (
                            <span className="block text-[11px] text-[var(--color-text-muted)]">
                              {PLAN_LABELS[d.plan]}
                            </span>
                          )}
                        </td>
                        <td className={`${tdClass} whitespace-nowrap`}>
                          {phone ? (
                            <span className="inline-flex items-center gap-2">
                              <a
                                href={`tel:+${waNumber(phone.number)}`}
                                className="font-medium text-[var(--color-text-primary)] hover:text-primary inline-flex items-center gap-1"
                              >
                                <Phone size={12} /> {phone.number}
                              </a>
                              <a
                                href={`https://wa.me/${waNumber(phone.number)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir WhatsApp"
                                className="text-emerald-600 hover:opacity-70"
                              >
                                <MessageCircle size={13} />
                              </a>
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                {phone.source}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)] text-xs">
                              <PhoneOff size={12} /> sin teléfono
                            </span>
                          )}
                        </td>
                        <td className={tdClass}>
                          {d.email ? (
                            <a
                              href={`mailto:${d.email}`}
                              className="text-[var(--color-text-secondary)] hover:text-primary inline-flex items-center gap-1 text-xs"
                            >
                              <Mail size={12} /> {d.email}
                            </a>
                          ) : (
                            <span className="text-[var(--color-text-muted)] text-xs">—</span>
                          )}
                        </td>
                        <td className={`${tdClass} text-xs text-[var(--color-text-secondary)]`}>
                          {d.specialties.map((s) => s.specialty.name).join(', ') || '—'}
                        </td>
                        <td className={`${tdClass} text-xs text-[var(--color-text-muted)] whitespace-nowrap`}>
                          {fecha(d.createdAt)}
                        </td>
                        <td className={`${tdClass} text-xs text-[var(--color-text-secondary)] whitespace-nowrap`}>
                          {DOCTOR_STATUS_LABELS[d.status]}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-5" aria-label="Paginación">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => navigate({ page: String(p) })}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                p === current.page
                  ? 'bg-primary text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
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
