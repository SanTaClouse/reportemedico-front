'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setArticleRelevance } from '@/lib/api'

interface Props {
  articleId: string
  currentRelevance: number
  token: string
}

export default function InlineRelevanceSelect({ articleId, currentRelevance, token }: Props) {
  const [relevance, setRelevance] = useState(currentRelevance)
  const [loading, setLoading] = useState(false)
  const [pendingValue, setPendingValue] = useState<number | null>(null)
  const router = useRouter()

  // Sincroniza el estado local cuando el servidor envía datos frescos tras router.refresh()
  useEffect(() => {
    setRelevance(currentRelevance)
  }, [currentRelevance])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRelevance = Number(e.target.value)
    if (newRelevance === 1) {
      setPendingValue(newRelevance)
      return
    }
    applyChange(newRelevance)
  }

  const applyChange = async (newRelevance: number) => {
    setPendingValue(null)
    setLoading(true)
    const labels: Record<number, string> = { 1: 'Hero (1)', 2: 'Destacado (2)', 3: 'Compacto (3)' }
    const toastId = toast.loading('Actualizando relevancia...')
    try {
      await setArticleRelevance(articleId, newRelevance, token)
      setRelevance(newRelevance)
      fetch('/api/revalidate', { method: 'POST' })
      router.refresh()
      toast.success(`Relevancia → ${labels[newRelevance] ?? newRelevance}`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar la relevancia', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  // Confirmación inline
  if (pendingValue !== null) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap">
          ¿Mover a Hero?
        </span>
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
    )
  }

  return (
    <select
      value={relevance}
      onChange={handleChange}
      disabled={loading}
      className="text-xs font-medium border-none bg-transparent focus:outline-none cursor-pointer disabled:opacity-50 text-[var(--color-text-secondary)]"
    >
      <option value={1}>● Hero (1)</option>
      <option value={2}>● Destacado (2)</option>
      <option value={3}>● Compacto (3)</option>
    </select>
  )
}
