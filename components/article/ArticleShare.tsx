'use client'

import { useState, type ComponentType, type MouseEvent } from 'react'
import { Share2, Copy, Check, Instagram, Loader2 } from 'lucide-react'
import { getShareUrls, copyToClipboard } from '@/lib/share'
import { WhatsAppIcon, XIcon, FacebookIcon, LinkedInIcon } from '@/components/icons/SocialBrands'

interface ArticleShareProps {
  title: string
  url: string
  /** Slug del artículo, para generar la story card vertical (/api/story-card) */
  slug: string
}

export default function ArticleShare({ title, url, slug }: ArticleShareProps) {
  const [copied, setCopied] = useState(false)
  const [storyBusy, setStoryBusy] = useState(false)
  const shareUrls = getShareUrls(title, url)

  const handleCopy = async () => {
    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /**
   * Genera la story card 1080×1920 y la comparte como imagen.
   * Instagram/WhatsApp NO aceptan texto suelto en Historias, solo imágenes, por
   * eso compartimos un File. En móvil abre la hoja nativa (→ "Añadir a tu
   * historia"); en escritorio (sin Web Share de archivos) descargamos el PNG.
   * En ambos casos copiamos el link para que pegar el sticker sea un toque.
   */
  const handleStoryShare = async () => {
    if (storyBusy) return
    setStoryBusy(true)
    try {
      const res = await fetch(`/api/story-card?slug=${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error(`story-card ${res.status}`)
      const blob = await res.blob()
      const file = new File([blob], 'reportemedico-historia.png', { type: 'image/png' })

      await copyToClipboard(url).catch(() => {})

      const canShareFile =
        typeof navigator !== 'undefined' &&
        !!navigator.canShare &&
        navigator.canShare({ files: [file] })

      if (canShareFile) {
        await navigator.share({ files: [file], title })
      } else {
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = 'reportemedico-historia.png'
        a.click()
        URL.revokeObjectURL(objectUrl)
      }
    } catch (err) {
      // El usuario puede cancelar la hoja de compartir (AbortError): no es un error real
      if ((err as Error)?.name !== 'AbortError') {
        console.error('[ArticleShare] No se pudo compartir la historia:', err)
      }
    } finally {
      setStoryBusy(false)
    }
  }

  /**
   * LinkedIn (y Facebook/X) no tienen un deep link que abra su app a un
   * compositor con el link pre-cargado, y los Universal Links de iOS no se
   * disparan al navegar desde una web o un in-app browser → terminan en el
   * navegador. La única forma fiable de abrir la app nativa es la hoja de
   * compartir del sistema, donde el usuario elige la app. En escritorio (sin
   * Web Share) dejamos que el href abra el flujo web de LinkedIn.
   */
  const handleNativeFirst = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      e.preventDefault()
      navigator.share({ title, url }).catch(() => {})
    }
  }

  type ShareButton = {
    label: string
    href: string
    color: string
    Icon: ComponentType<{ size?: number; className?: string }>
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  }

  const buttons: ShareButton[] = [
    { label: 'WhatsApp', href: shareUrls.whatsapp, color: '#25D366', Icon: WhatsAppIcon },
    { label: 'X', href: shareUrls.twitter, color: '#000000', Icon: XIcon },
    { label: 'Facebook', href: shareUrls.facebook, color: '#1877F2', Icon: FacebookIcon },
    { label: 'LinkedIn', href: shareUrls.linkedin, color: '#0A66C2', Icon: LinkedInIcon, onClick: handleNativeFirst },
  ]

  return (
    <>
      {/* Desktop: sidebar flotante izquierda */}
      <div className="hidden lg:flex flex-col items-center gap-2 fixed left-6 top-1/2 -translate-y-1/2 z-40">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
          Compartir
        </span>
        {buttons.map(({ label, href, color, Icon, onClick }) => (
          <a
            key={label}
            href={href}
            onClick={onClick}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartir en ${label}`}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
          >
            <Icon size={17} />
          </a>
        ))}
        <button
          onClick={handleStoryShare}
          disabled={storyBusy}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform disabled:opacity-60 disabled:hover:scale-100"
          style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
          aria-label="Compartir en historia de Instagram"
          title="Compartir en historia"
        >
          {storyBusy ? <Loader2 size={14} className="animate-spin" /> : <Instagram size={16} />}
        </button>
        <button
          onClick={handleCopy}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
          aria-label="Copiar link"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Mobile: barra fija inferior */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-2 flex items-center justify-around">
        <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
          <Share2 size={14} /> Compartir
        </span>
        {buttons.map(({ label, href, color, Icon, onClick }) => (
          <a
            key={label}
            href={href}
            onClick={onClick}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartir en ${label}`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            <Icon size={15} />
          </a>
        ))}
        <button
          onClick={handleStoryShare}
          disabled={storyBusy}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
          aria-label="Compartir en historia de Instagram"
        >
          {storyBusy ? <Loader2 size={14} className="animate-spin" /> : <Instagram size={15} />}
        </button>
        <button
          onClick={handleCopy}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-border)]"
          aria-label="Copiar link"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </>
  )
}
