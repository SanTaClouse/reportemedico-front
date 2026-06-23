'use client'

import { useState } from 'react'
import { FileText, Rss, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { deleteSubscriber, type Subscriber } from '@/lib/api'
import { formatDateShort } from '@/lib/utils'

const normalizeName = (name?: string | null) => (name ?? '').trim().toLowerCase()

export default function SubscribersTable({
  subscribers: initial,
  token,
}: {
  subscribers: Subscriber[]
  token: string
}) {
  const [subscribers, setSubscribers] = useState(initial)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Posibles duplicados: mismo nombre normalizado más de una vez (en esta página)
  const nameCounts = new Map<string, number>()
  for (const s of subscribers) {
    const key = normalizeName(s.name)
    if (key) nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteSubscriber(id, token)
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // no rompemos la tabla si falla; el admin puede reintentar
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Email</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Nombre</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Origen</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Intereses</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Registrado</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {subscribers.map((s) => {
            const isDup = normalizeName(s.name) !== '' && (nameCounts.get(normalizeName(s.name)) ?? 0) > 1
            return (
              <tr key={s.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[var(--color-text-primary)]">{s.email}</td>
                <td className="px-5 py-3.5 text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    {s.name ?? <span className="text-[var(--color-text-muted)]">—</span>}
                    {isDup && (
                      <span
                        title="Hay otro suscriptor con el mismo nombre — puede ser un duplicado"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
                      >
                        <AlertTriangle size={10} /> posible duplicado
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {s.source === 'ARTICLE_SUBMISSION' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      <FileText size={10} /> Artículo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Rss size={10} /> Newsletter
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {s.tags && s.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.tags.slice(0, 3).map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {s.tags.length > 3 && (
                        <span className="text-[10px] text-[var(--color-text-muted)]">+{s.tags.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[var(--color-text-muted)] text-xs">{formatDateShort(s.createdAt)}</td>
                <td className="px-5 py-3.5 text-right">
                  {confirmId === s.id ? (
                    <span className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Borrar
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        disabled={deletingId === s.id}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(s.id)}
                      title="Eliminar suscriptor"
                      className="text-[var(--color-text-muted)] hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
