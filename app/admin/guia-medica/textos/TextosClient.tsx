'use client'

import { useState } from 'react'
import { Loader2, Check, Pencil, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { saveProgrammaticIntro, type ProgrammaticPair } from '@/lib/api-guia'

interface Props {
  initialPairs: ProgrammaticPair[]
  token: string
}

export default function TextosClient({ initialPairs, token }: Props) {
  const [pairs, setPairs] = useState(initialPairs)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const keyOf = (p: ProgrammaticPair) => `${p.specialtyId}:${p.cityId}`

  const startEdit = (p: ProgrammaticPair) => {
    setEditingKey(keyOf(p))
    setDraft(p.introText ?? '')
  }

  const handleSave = async (p: ProgrammaticPair) => {
    setSaving(true)
    const toastId = toast.loading('Guardando...')
    try {
      const res = await saveProgrammaticIntro(
        { specialtyId: p.specialtyId, cityId: p.cityId, introText: draft },
        token,
      )
      setPairs((prev) =>
        prev.map((x) => (keyOf(x) === keyOf(p) ? { ...x, introText: res.introText } : x)),
      )
      setEditingKey(null)
      toast.success(res.introText ? 'Texto guardado — la página se revalida sola' : 'Texto eliminado', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-1">
        Textos de páginas (Especialidad × Ciudad)
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Texto introductorio editorial para las combinaciones con más médicos. Si lo dejás vacío, la
        página usa una intro automática con datos reales. Enriquecé primero las que Search Console
        muestre con tráfico.
      </p>

      {pairs.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-12 text-center">
          <FileText size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-muted)]">
            Todavía no hay combinaciones especialidad × ciudad con médicos publicados. Aparecerán acá
            a medida que se publiquen perfiles.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pairs.map((p) => {
            const isEditing = editingKey === keyOf(p)
            return (
              <li key={keyOf(p)} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {p.specialtyName} en {p.cityName}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {p.doctorCount} médico{p.doctorCount === 1 ? '' : 's'} · /guia-medica/{p.specialtySlug}/{p.citySlug}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.introText
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {p.introText ? 'Editorial' : 'Automático'}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      autoFocus
                      placeholder="Texto introductorio único para esta combinación..."
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(p)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        Cancelar
                      </button>
                      <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">
                        Vacío = volver a automático
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 flex-1">
                      {p.introText ?? <em className="text-[var(--color-text-muted)]">Intro automática con datos reales</em>}
                    </p>
                    <button
                      onClick={() => startEdit(p)}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary-pale transition-colors"
                    >
                      <Pencil size={12} /> {p.introText ? 'Editar' : 'Escribir'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
