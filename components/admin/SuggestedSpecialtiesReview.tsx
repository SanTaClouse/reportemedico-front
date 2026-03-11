'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  approveSpecialtyAction,
  rejectSpecialtyAction,
} from '@/app/admin/articulos-pendientes/actions'

interface Props {
  articleId: string
  initialSpecialties: string[]
}

export default function SuggestedSpecialtiesReview({ articleId, initialSpecialties }: Props) {
  const [pending, setPending] = useState(initialSpecialties)
  const [isPending, startTransition] = useTransition()
  const [loadingName, setLoadingName] = useState<string | null>(null)

  if (pending.length === 0) return null

  const handleApprove = (name: string) => {
    setLoadingName(name)
    startTransition(async () => {
      try {
        await approveSpecialtyAction(articleId, name)
        setPending((prev) => prev.filter((s) => s !== name))
        toast.success(`Especialidad "${name}" aprobada y creada`)
      } catch {
        toast.error(`Error al aprobar "${name}"`)
      } finally {
        setLoadingName(null)
      }
    })
  }

  const handleReject = (name: string) => {
    setLoadingName(name)
    startTransition(async () => {
      try {
        await rejectSpecialtyAction(articleId, name)
        setPending((prev) => prev.filter((s) => s !== name))
        toast.info(`Propuesta "${name}" descartada`)
      } catch {
        toast.error(`Error al rechazar "${name}"`)
      } finally {
        setLoadingName(null)
      }
    })
  }

  return (
    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
        Especialidades propuestas por el autor:
      </p>
      <div className="flex flex-wrap gap-2">
        {pending.map((name) => (
          <div
            key={name}
            className="flex items-center gap-1.5 bg-white dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-full px-3 py-1"
          >
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">{name}</span>
            <button
              onClick={() => handleApprove(name)}
              disabled={loadingName === name || isPending}
              className="text-green-600 hover:text-green-800 disabled:opacity-40 transition-colors"
              title="Aprobar: crea la especialidad y la vincula al artículo"
            >
              {loadingName === name ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle size={13} />
              )}
            </button>
            <button
              onClick={() => handleReject(name)}
              disabled={loadingName === name || isPending}
              className="text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
              title="Rechazar propuesta"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
        ✓ Aprobar crea la especialidad en la BD y la vincula al artículo · ✕ Descarta la propuesta
      </p>
    </div>
  )
}
