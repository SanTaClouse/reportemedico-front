'use client'

import { useState } from 'react'
import { MapPin, Plus, Check, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ClinicFormModal } from './ClinicForm'
import {
  resolveClinicSuggestion, dismissClinicSuggestion,
  type Doctor, type City, type Clinic, type ClinicSuggestion,
} from '@/lib/api-guia'

interface Props {
  doctorId: string
  suggestions: ClinicSuggestion[]
  clinics: Clinic[]
  cities: City[]
  token: string
  /** Devuelve el médico actualizado tras resolver/descartar para refrescar la ficha. */
  onResolved: (doctor: Doctor) => void
}

/**
 * Cola de normalización: el médico escribió clínicas en texto libre y el admin
 * las mapea a una clínica del catálogo (existente o recién creada) o las descarta
 * (07 §14). El perfil no debería aprobarse con clínicas sin normalizar.
 */
export default function ClinicSuggestionsPanel({
  doctorId, suggestions, clinics, cities, token, onResolved,
}: Props) {
  // Catálogos en vivo: una clínica creada acá queda disponible para mapear las demás.
  const [clinicOptions, setClinicOptions] = useState<Clinic[]>(clinics)
  const [cityOptions, setCityOptions] = useState<City[]>(cities)

  if (suggestions.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 space-y-3">
      <div className="flex items-start gap-2">
        <MapPin size={18} className="text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Clínicas sin normalizar ({suggestions.length})
          </p>
          <p className="text-xs text-amber-800">
            El médico escribió estas clínicas en texto libre. Mapéalas a una clínica del catálogo (o crea la nueva con su ubicación) antes de publicar.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {suggestions.map((s) => (
          <SuggestionRow
            key={s.id}
            doctorId={doctorId}
            suggestion={s}
            clinics={clinicOptions}
            cities={cityOptions}
            token={token}
            onClinicCreated={(c) => setClinicOptions((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))}
            onCityCreated={(c) => setCityOptions((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))}
            onResolved={onResolved}
          />
        ))}
      </ul>
    </div>
  )
}

function SuggestionRow({
  doctorId, suggestion, clinics, cities, token, onClinicCreated, onCityCreated, onResolved,
}: {
  doctorId: string
  suggestion: ClinicSuggestion
  clinics: Clinic[]
  cities: City[]
  token: string
  onClinicCreated: (clinic: Clinic) => void
  onCityCreated: (city: City) => void
  onResolved: (doctor: Doctor) => void
}) {
  const [selectedClinicId, setSelectedClinicId] = useState('')
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const resolveWith = async (clinicId: string) => {
    setBusy(true)
    const toastId = toast.loading('Asociando clínica...')
    try {
      const updated = await resolveClinicSuggestion(
        doctorId, suggestion.id,
        { clinicId, schedule: suggestion.schedule ?? undefined },
        token,
      )
      toast.success('Clínica normalizada y asociada al médico', { id: toastId })
      onResolved(updated)
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    toast.warning(`¿Descartar la clínica sugerida "${suggestion.rawName}"?`, {
      action: {
        label: 'Descartar',
        onClick: async () => {
          setBusy(true)
          const toastId = toast.loading('Descartando...')
          try {
            const updated = await dismissClinicSuggestion(doctorId, suggestion.id, token)
            toast.success('Sugerencia descartada', { id: toastId })
            onResolved(updated)
          } catch (err) {
            toast.error((err as Error).message, { id: toastId })
            setBusy(false)
          }
        },
      },
    })
  }

  return (
    <li className="bg-[var(--color-surface)] rounded-lg border border-amber-200 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            &ldquo;{suggestion.rawName}&rdquo;
          </p>
          {suggestion.schedule && (
            <p className="text-[11px] text-[var(--color-text-muted)]">🕐 {suggestion.schedule}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={busy}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
        >
          <Trash2 size={12} /> Descartar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedClinicId}
          onChange={(e) => setSelectedClinicId(e.target.value)}
          disabled={busy}
          className="flex-1 min-w-44 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Mapear a clínica existente...</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.city?.name})</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => resolveWith(selectedClinicId)}
          disabled={busy || !selectedClinicId}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Mapear
        </button>
        <span className="text-xs text-[var(--color-text-muted)]">o</span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-primary/30 text-primary rounded-lg text-xs font-medium hover:bg-primary-pale disabled:opacity-50 transition-colors"
        >
          <Plus size={14} /> Crear nueva
        </button>
      </div>

      <ClinicFormModal
        open={modalOpen}
        title={`Crear clínica: ${suggestion.rawName}`}
        onClose={() => setModalOpen(false)}
        token={token}
        cities={cities}
        onCityCreated={onCityCreated}
        onSaved={(clinic) => {
          onClinicCreated(clinic)
          setModalOpen(false)
          void resolveWith(clinic.id)
        }}
        submitLabel="Crear y asociar"
      />
    </li>
  )
}
