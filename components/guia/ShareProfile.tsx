'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Instagram, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Compartir el perfil del médico:
 * - "Compartir": menú nativo (Web Share) → en celular elegís Instagram/Stories/DM/WhatsApp.
 * - "Imagen para historia": genera una imagen vertical 1080×1920 lista para Stories
 *   (foto + nombre + especialidad + marca + link). En mobile la pasa a la hoja de
 *   compartir como archivo (→ "Añadir a tu historia"); en desktop la descarga.
 * - "Copiar enlace": copia el link con la instrucción de pegarlo (IG no acepta
 *   links con preview desde la web).
 */
export default function ShareProfile({ url, name, slug }: { url: string; name: string; slug: string }) {
  const [copied, setCopied] = useState(false)
  const [storyBusy, setStoryBusy] = useState(false)

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

  const handleStoryShare = async () => {
    if (storyBusy) return
    setStoryBusy(true)
    try {
      const res = await fetch(`/api/doctor-story-card?slug=${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error(`story-card ${res.status}`)
      const blob = await res.blob()
      const file = new File([blob], 'reportemedico-perfil.png', { type: 'image/png' })

      // Copiamos el link para que pegar el sticker en la historia sea un toque
      await navigator.clipboard.writeText(url).catch(() => {})

      const canShareFile =
        typeof navigator !== 'undefined' &&
        !!navigator.canShare &&
        navigator.canShare({ files: [file] })

      if (canShareFile) {
        await navigator.share({ files: [file], title: name })
      } else {
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = 'reportemedico-perfil.png'
        a.click()
        URL.revokeObjectURL(objectUrl)
        toast.success('Imagen descargada — súbela a tu historia y pega el enlace (ya copiado)')
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        toast.error('No se pudo generar la imagen')
      }
    } finally {
      setStoryBusy(false)
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
        onClick={handleStoryShare}
        disabled={storyBusy}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
        style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
      >
        {storyBusy ? <Loader2 size={15} className="animate-spin" /> : <Instagram size={15} />}
        Imagen para historia
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
        Para Instagram: usa la imagen en tu historia y pega el enlace en el sticker o tu bio.
      </span>
    </div>
  )
}
