'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error al cargar datos del admin. Antes, si la API fallaba, la lista salía
 * vacía y parecía que no había nada cargado: ahora se distingue el fallo del
 * "todavía no hay registros".
 */
export default function AdminLoadError({ what, detail }: { what: string; detail?: string }) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10">
      <p className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
        <AlertTriangle size={17} strokeWidth={1.5} /> No se pudo cargar {what}
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Suele pasar cuando el servidor está reiniciando. Espera unos segundos y reintenta.
        {detail ? ` (${detail})` : ''}
      </p>
      <button
        onClick={() => router.refresh()}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        <RefreshCw size={14} strokeWidth={2} /> Reintentar
      </button>
    </div>
  )
}
