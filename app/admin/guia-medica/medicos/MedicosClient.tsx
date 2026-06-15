'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { Plus, Search, BadgeCheck, Video, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { DOCTOR_STATUS_LABELS, type DoctorListResponse, type DoctorStatus } from '@/lib/api-guia'

const STATUS_STYLES: Record<DoctorStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-red-100 text-red-600',
}

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'INACTIVE', label: 'Inactivos' },
]

export default function MedicosClient({ initialData }: { initialData: DoctorListResponse }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const currentStatus = searchParams.get('status') ?? ''
  const { items, total, page, limit } = initialData
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const navigate = (params: Record<string, string>) => {
    const qs = new URLSearchParams()
    const merged = { status: currentStatus, search, page: '1', ...params }
    if (merged.status) qs.set('status', merged.status)
    if (merged.search) qs.set('search', merged.search)
    if (merged.page !== '1') qs.set('page', merged.page)
    router.push(`/admin/guia-medica/medicos${qs.size ? `?${qs}` : ''}`)
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">Médicos</h1>
        <Link
          href="/admin/guia-medica/medicos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nuevo médico
        </Link>
      </div>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">{total} médicos en la guía</p>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => navigate({ status: value })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              currentStatus === value
                ? 'bg-primary text-white border-primary'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
            }`}
          >
            {label}
          </button>
        ))}
        <form
          onSubmit={(e) => { e.preventDefault(); navigate({}) }}
          className="relative ml-auto"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o exequátur..."
            className="pl-8 pr-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
          />
        </form>
      </div>

      <ul className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        {items.map((doc) => (
          <li key={doc.id}>
            <Link
              href={`/admin/guia-medica/medicos/${doc.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 relative">
                {doc.photoUrl ? (
                  <NextImage src={doc.photoUrl} alt={`${doc.firstName} ${doc.lastName}`} fill className="object-cover" sizes="40px" />
                ) : (
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {doc.firstName[0]}{doc.lastName[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-1.5">
                  {doc.title} {doc.firstName} {doc.lastName}
                  {doc.isVerified && <BadgeCheck size={14} className="text-primary shrink-0" />}
                  {doc.videoUrl && <Video size={13} className="text-[var(--color-text-muted)] shrink-0" />}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {doc.specialties.map((s) => s.specialty.name).join(', ') || 'Sin especialidad'}
                  {doc.clinics.length > 0 && ` · ${doc.clinics.map((c) => c.clinic.name).join(', ')}`}
                </p>
              </div>
              {doc.plan === 'PREMIUM' && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-accent,#F0B414)]/15 text-amber-700">
                  Premium
                </span>
              )}
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[doc.status]}`}>
                {DOCTOR_STATUS_LABELS[doc.status]}
              </span>
              {doc.status === 'PUBLISHED' && (
                <span
                  role="link"
                  onClick={(e) => { e.preventDefault(); window.open(`/medico/${doc.slug}`, '_blank') }}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-primary rounded-lg cursor-pointer"
                  title="Ver perfil público"
                >
                  <ExternalLink size={14} />
                </span>
              )}
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
            No hay médicos con este filtro. Crea el primero con &ldquo;Nuevo médico&rdquo;.
          </li>
        )}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => navigate({ page: String(p) })}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                p === page
                  ? 'bg-primary text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
