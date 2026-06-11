'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { ClipboardList, Eye, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { setDoctorStatus, type Doctor } from '@/lib/api-guia'

interface Props {
  initialDoctors: Doctor[]
  token: string
}

export default function PendientesClient({ initialDoctors, token }: Props) {
  const router = useRouter()
  const [doctors, setDoctors] = useState(initialDoctors)

  // Detección simple de posibles duplicados dentro de la cola + contra el mismo exequátur
  const duplicateWarning = (doc: Doctor): string | null => {
    const sameName = doctors.find(
      (d) =>
        d.id !== doc.id &&
        d.firstName.toLowerCase() === doc.firstName.toLowerCase() &&
        d.lastName.toLowerCase() === doc.lastName.toLowerCase(),
    )
    if (sameName) return 'Hay otro médico pendiente con el mismo nombre'
    const sameExequatur = doc.exequatur
      ? doctors.find((d) => d.id !== doc.id && d.exequatur === doc.exequatur)
      : null
    if (sameExequatur) return 'Hay otro médico pendiente con el mismo exequátur'
    return null
  }

  const handleQuickApprove = (doc: Doctor) => {
    toast.warning(
      `¿Aprobar y publicar a ${doc.title ?? ''} ${doc.firstName} ${doc.lastName}? Revisá antes que los datos estén completos.`,
      {
        action: {
          label: 'Publicar',
          onClick: async () => {
            const toastId = toast.loading('Publicando...')
            try {
              await setDoctorStatus(doc.id, 'PUBLISHED', token)
              setDoctors((prev) => prev.filter((d) => d.id !== doc.id))
              toast.success('Perfil publicado — páginas revalidadas', { id: toastId })
              router.refresh()
            } catch (err) {
              toast.error((err as Error).message, { id: toastId })
            }
          },
        },
      },
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-1">
        Aprobaciones de la Guía Médica
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Médicos que enviaron su perfil y esperan revisión. Revisá los datos, normalizá la clínica si hace falta, pulí la bio y publicá.
      </p>

      {doctors.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-12 text-center">
          <ClipboardList size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-muted)]">
            No hay perfiles pendientes. Los registros nuevos de médicos van a aparecer acá.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {doctors.map((doc) => {
            const warning = duplicateWarning(doc)
            const completeness = [
              doc.photoUrl, doc.bio, doc.phonePublic,
              doc.specialties.length > 0, doc.clinics.length > 0, doc.insurances.length > 0,
            ].filter(Boolean).length
            return (
              <li key={doc.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 relative">
                    {doc.photoUrl ? (
                      <NextImage src={doc.photoUrl} alt={`${doc.firstName} ${doc.lastName}`} fill className="object-cover" sizes="48px" />
                    ) : (
                      <span className="text-sm font-semibold text-[var(--color-text-muted)]">
                        {doc.firstName[0]}{doc.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {doc.title} {doc.firstName} {doc.lastName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {doc.specialties.map((s) => s.specialty.name).join(', ') || 'Sin especialidad'}
                      {doc.clinics.length > 0 && ` · ${doc.clinics.map((c) => c.clinic.name).join(', ')}`}
                      {doc.exequatur && ` · Exequátur ${doc.exequatur}`}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      Perfil {completeness}/6 completo · enviado el {new Date(doc.updatedAt).toLocaleDateString('es-DO')}
                    </p>
                    {warning && (
                      <p className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-1.5 w-fit">
                        <AlertTriangle size={12} /> {warning}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/admin/guia-medica/medicos/${doc.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <Eye size={13} /> Revisar
                    </Link>
                    <button
                      onClick={() => handleQuickApprove(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle2 size={13} /> Aprobar
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
