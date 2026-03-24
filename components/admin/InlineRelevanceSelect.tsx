'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setArticleRelevance, RELEVANCE_LIMITS, RELEVANCE_LABELS } from '@/lib/api'

interface Props {
  articleId: string
  currentRelevance: number | null
  token: string
  counts?: Record<number, number>
}

// Niveles que requieren confirmación antes de aplicar (impacto alto en el home)
const CONFIRM_LEVELS = new Set([1, 2])

/**
 * Calcula la cadena de desplazamientos que causaría mover un artículo a `targetLevel`.
 * Tiene en cuenta que el artículo puede estar actualmente en `currentRelevance`
 * (por lo que ese nivel pierde 1 artículo antes de que llegue el nuevo).
 */
function computeCascadeImpact(
  targetLevel: number,
  currentRelevance: number | null,
  counts: Record<number, number>,
): string[] {
  const impacts: string[] = []

  // Ajustar conteos: el artículo sale de su nivel actual
  const adjusted = { ...counts }
  if (currentRelevance != null && currentRelevance !== targetLevel) {
    adjusted[currentRelevance] = Math.max(0, (adjusted[currentRelevance] ?? 0) - 1)
  }

  let overflow = 1 // 1 artículo entrando al nivel objetivo
  let level = targetLevel

  while (level <= 5 && overflow > 0) {
    const current = adjusted[level] ?? 0
    const limit = RELEVANCE_LIMITS[level]
    const excess = current + overflow - limit

    if (excess > 0) {
      if (level === 5) {
        impacts.push(
          `${excess} artículo${excess > 1 ? 's' : ''} perderá${excess > 1 ? 'n' : ''} su slot editorial`,
        )
      } else {
        impacts.push(`${excess} de ${RELEVANCE_LABELS[level]} → ${RELEVANCE_LABELS[level + 1]}`)
      }
      overflow = excess
    } else {
      overflow = 0
    }
    level++
  }

  return impacts
}

export default function InlineRelevanceSelect({ articleId, currentRelevance, token, counts = {} }: Props) {
  const [relevance, setRelevance] = useState(currentRelevance)
  const [loading, setLoading] = useState(false)
  const [pendingValue, setPendingValue] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => { setRelevance(currentRelevance) }, [currentRelevance])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) return
    const val = Number(e.target.value)
    if (CONFIRM_LEVELS.has(val)) { setPendingValue(val); return }
    applyChange(val)
  }

  const applyChange = async (newRelevance: number) => {
    setPendingValue(null)
    setLoading(true)
    const toastId = toast.loading('Actualizando relevancia...')
    try {
      await setArticleRelevance(articleId, newRelevance, token)
      setRelevance(newRelevance)
      fetch('/api/revalidate', { method: 'POST' })
      router.refresh()
      toast.success(`Relevancia → ${RELEVANCE_LABELS[newRelevance] ?? newRelevance}`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar la relevancia', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  if (pendingValue !== null) {
    const cascadeImpacts = computeCascadeImpact(pendingValue, relevance, counts)

    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap">
          ¿Mover a {RELEVANCE_LABELS[pendingValue]}?
        </span>
        {cascadeImpacts.length > 0 && (
          <span className="text-[10px] text-[var(--color-text-muted)] leading-snug">
            {cascadeImpacts.map((impact, i) => (
              <span key={i} className={impact.includes('perderá') ? 'text-red-500 font-medium' : ''}>
                {impact}{i < cascadeImpacts.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => applyChange(pendingValue)}
            className="text-[10px] px-2 py-0.5 bg-[var(--brand-navy)] text-white rounded font-semibold hover:opacity-80 transition-opacity"
          >
            Sí
          </button>
          <button
            onClick={() => setPendingValue(null)}
            className="text-[10px] px-2 py-0.5 border border-[var(--color-border)] rounded text-[var(--color-text-muted)] hover:border-[var(--color-text-secondary)] transition-colors"
          >
            No
          </button>
        </div>
      </div>
    )
  }

  return (
    <select
      value={relevance ?? ''}
      onChange={handleChange}
      disabled={loading}
      className="text-xs font-medium border-none bg-transparent focus:outline-none cursor-pointer disabled:opacity-50 text-[var(--color-text-secondary)]"
    >
      {relevance == null && (
        <option value="" disabled>— Sin slot editorial —</option>
      )}
      <option value={1}>● Hero (máx {RELEVANCE_LIMITS[1]})</option>
      <option value={2}>● Lead Destacada (máx {RELEVANCE_LIMITS[2]})</option>
      <option value={3}>● Big Destacada (máx {RELEVANCE_LIMITS[3]})</option>
      <option value={4}>● Small Destacada (máx {RELEVANCE_LIMITS[4]})</option>
      <option value={5}>● Actualidad (máx {RELEVANCE_LIMITS[5]})</option>
    </select>
  )
}
