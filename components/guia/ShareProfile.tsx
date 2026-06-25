'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Compartir el perfil del médico. Usa el menú nativo del dispositivo (Web Share
 * API) cuando está disponible — en celular permite elegir Instagram/Stories/DM/
 * WhatsApp. Siempre ofrece "Copiar enlace" con la instrucción de pegarlo, porque
 * Instagram no acepta links con preview desde la web.
 */
export default function ShareProfile({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Enlace copiado — pégalo en tu historia o bio de Instagram')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const share = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: name, text: `Mira el perfil de ${name} en Reporte Médico`, url })
      } catch {
        /* el usuario canceló el menú: sin ruido */
      }
    } else {
      copy()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-[var(--color-primary,#001450)] text-white hover:opacity-90 transition-opacity"
      >
        <Share2 size={15} /> Compartir
      </button>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40 transition-colors"
      >
        {copied ? <Check size={15} className="text-[var(--color-primary)]" /> : <Copy size={15} />}
        {copied ? 'Copiado' : 'Copiar enlace'}
      </button>
      <span className="text-[11px] text-[var(--color-text-muted)] basis-full sm:basis-auto">
        Para Instagram: copia el enlace y pégalo en tu historia o bio.
      </span>
    </div>
  )
}
