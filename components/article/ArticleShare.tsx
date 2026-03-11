'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { getShareUrls, copyToClipboard } from '@/lib/share'

interface ArticleShareProps {
  title: string
  url: string
}

export default function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false)
  const shareUrls = getShareUrls(title, url)

  const handleCopy = async () => {
    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const buttons = [
    { label: 'WhatsApp', href: shareUrls.whatsapp, color: '#25D366' },
    { label: 'Twitter', href: shareUrls.twitter, color: '#1DA1F2' },
    { label: 'Facebook', href: shareUrls.facebook, color: '#1877F2' },
    { label: 'LinkedIn', href: shareUrls.linkedin, color: '#0A66C2' },
  ]

  return (
    <>
      {/* Desktop: sidebar flotante izquierda */}
      <div className="hidden lg:flex flex-col items-center gap-2 fixed left-6 top-1/2 -translate-y-1/2 z-40">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
          Compartir
        </span>
        {buttons.map(({ label, href, color }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartir en ${label}`}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
          >
            {label[0]}
          </a>
        ))}
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
        {buttons.map(({ label, href, color }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Compartir en ${label}`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: color }}
          >
            {label[0]}
          </a>
        ))}
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
