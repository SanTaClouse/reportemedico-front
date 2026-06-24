'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Download, MessageCircle, Activity, Mail } from 'lucide-react'
import { DOCTOR_STATUS_LABELS, type EngagementRow, type DoctorStatus } from '@/lib/api-guia'

const STATUS_STYLES: Record<DoctorStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-red-100 text-red-600',
}

type Filter = 'all' | 'PREMIUM' | 'PUBLISHED' | 'inactivos-30d'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'inactivos-30d', label: 'Sin conexión +30d' },
]

const DAY = 24 * 60 * 60 * 1000

function relativeDate(iso: string | null): string {
  if (!iso) return 'Nunca'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 30) return `Hace ${days} días`
  return new Date(iso).toLocaleDateString('es-DO')
}

export default function ActividadClient({ rows }: { rows: EngagementRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    const cutoff = Date.now() - 30 * DAY
    return rows.filter((r) => {
      if (filter === 'PREMIUM') return r.plan === 'PREMIUM'
      if (filter === 'PUBLISHED') return r.status === 'PUBLISHED'
      if (filter === 'inactivos-30d') return !r.lastSession || new Date(r.lastSession).getTime() < cutoff
      return true
    })
  }, [rows, filter])

  const exportCsv = () => {
    const header = ['Médico', 'Plan', 'Estado', 'Última conexión', 'Sesiones 30d', 'Sesiones total', 'Clics WhatsApp 30d', 'Clics WhatsApp total', 'Sesiones desde email', 'Artículos']
    const lines = filtered.map((r) => [
      r.name, r.plan, r.status,
      r.lastSession ? new Date(r.lastSession).toISOString().slice(0, 10) : '',
      r.sessions30d, r.sessionsTotal, r.whatsappClicks30d, r.whatsappClicksTotal, r.viaEmailSessions, r.articles,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = '﻿' + [header.join(','), ...lines].join('\n') // BOM para acentos en Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `engagement-medicos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Actividad de médicos</h1>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
        >
          <Download size={15} /> Exportar CSV
        </button>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">
        Última conexión, sesiones y clics de WhatsApp por médico. El dato estrella para renovar: los
        clics de WhatsApp del mes.
      </p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === value
                ? 'bg-primary text-white border-primary'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-[var(--color-text-muted)] ml-auto">{filtered.length} médicos</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-12 text-center">
          <Activity size={28} className="mx-auto text-[var(--color-text-muted)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-muted)]">Sin médicos para este filtro todavía.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                <th className="px-4 py-3 font-semibold">Médico</th>
                <th className="px-3 py-3 font-semibold">Estado</th>
                <th className="px-3 py-3 font-semibold">Última conexión</th>
                <th className="px-3 py-3 font-semibold text-center">Sesiones 30d</th>
                <th className="px-3 py-3 font-semibold text-center" title="Clics de WhatsApp (30 días / total)">
                  <MessageCircle size={13} className="inline" /> 30d / total
                </th>
                <th className="px-3 py-3 font-semibold text-center" title="Sesiones que entraron desde un email (digest)">
                  <Mail size={13} className="inline" /> Email
                </th>
                <th className="px-3 py-3 font-semibold text-center">Artículos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/guia-medica/medicos/${r.id}`} className="font-medium text-[var(--color-text-primary)] hover:text-primary">
                      {r.name}
                    </Link>
                    {r.plan === 'PREMIUM' && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-700">Premium</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}>
                      {DOCTOR_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--color-text-secondary)]">{relativeDate(r.lastSession)}</td>
                  <td className="px-3 py-3 text-center text-[var(--color-text-secondary)]">{r.sessions30d}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-[var(--color-primary,#001450)]">{r.whatsappClicks30d}</span>
                    <span className="text-[var(--color-text-muted)]"> / {r.whatsappClicksTotal}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-[var(--color-text-secondary)]">{r.viaEmailSessions}</td>
                  <td className="px-3 py-3 text-center text-[var(--color-text-secondary)]">{r.articles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
