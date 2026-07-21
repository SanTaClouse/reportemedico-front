'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  max?: number
  /** Deshabilita la carga (ej: el plan del médico no lo incluye) */
  disabled?: boolean
}

/**
 * Carga de patologías / procedimientos como tags de texto libre.
 * Replica el campo "Patologías:" de la card de la revista impresa. Es el dato
 * de más valor SEO del perfil: el paciente busca "cálculos renales", no
 * "urología". El backend deduplica y limpia HTML igual (defensa en profundidad).
 */
export default function ConditionsInput({ value, onChange, max = 20, disabled = false }: Props) {
  const [draft, setDraft] = useState('')
  const full = value.length >= max

  const add = () => {
    const item = draft.trim().replace(/[,;]+$/, '').trim()
    if (!item || full) return
    if (value.some((c) => c.toLowerCase() === item.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, item])
    setDraft('')
  }

  const remove = (item: string) => onChange(value.filter((c) => c !== item))

  return (
    <div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter NO debe enviar el formulario entero
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
            if (e.key === 'Backspace' && !draft && value.length) remove(value[value.length - 1])
          }}
          onBlur={add}
          disabled={disabled || full}
          placeholder={full ? `Máximo ${max}` : 'Ej: Cálculos renales'}
          aria-label="Agregar patología o procedimiento"
          className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || full || !draft.trim()}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 disabled:opacity-40 transition-colors"
          aria-label="Agregar"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mt-2">
          {value.map((c) => (
            <li key={c}>
              <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                {c}
                <button
                  type="button"
                  onClick={() => remove(c)}
                  disabled={disabled}
                  className="p-0.5 rounded-full hover:bg-[var(--color-border)] transition-colors"
                  aria-label={`Quitar ${c}`}
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
        Enter o coma para agregar. {value.length}/{max}
      </p>
    </div>
  )
}
