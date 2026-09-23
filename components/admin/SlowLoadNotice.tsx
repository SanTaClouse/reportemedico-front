'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Aviso dentro del esqueleto de carga del admin.
 *
 * Cuando la API está lenta —un redeploy, por ejemplo— la página puede tardar
 * varios segundos y el esqueleto se ve igual que un cuelgue. A los 6 segundos
 * esto aparece y ofrece recargar, en vez de dejar a la persona adivinando.
 */
export default function SlowLoadNotice({ afterMs = 6000 }: { afterMs?: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setShow(true), afterMs)
    return () => clearTimeout(id)
  }, [afterMs])

  if (!show) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
      <span className="text-amber-900 dark:text-amber-200">
        Esto está tardando más de lo normal. Puede ser que el servidor esté reiniciando.
      </span>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-700"
      >
        <RefreshCw size={14} strokeWidth={2} /> Recargar
      </button>
    </div>
  )
}
