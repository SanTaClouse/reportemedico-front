'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { cldUrl } from '@/lib/cloudinary'
import type { GalleryItem } from '@/lib/api'

interface ArticleGalleryProps {
  items: GalleryItem[]
}

export default function ArticleGallery({ items }: ArticleGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const isOpen = lightboxIndex !== null

  const goTo = useCallback(
    (index: number) => {
      setLightboxIndex(((index % items.length) + items.length) % items.length)
    },
    [items.length],
  )

  const close = useCallback(() => setLightboxIndex(null), [])

  // Teclado: flechas + Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(lightboxIndex! + 1)
      else if (e.key === 'ArrowLeft') goTo(lightboxIndex! - 1)
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, lightboxIndex, goTo, close])

  // Bloquear scroll del body cuando el lightbox está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Swipe en mobile
  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || lightboxIndex === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) goTo(lightboxIndex + (diff > 0 ? 1 : -1))
    setTouchStart(null)
  }

  if (items.length === 0) return null

  const currentItem = lightboxIndex !== null ? items[lightboxIndex] : null

  return (
    <>
      {/* ─── Galería ─────────────────────────────────────────────── */}
      <section className="mt-10 pt-8 border-t border-[var(--color-border)]">
        <h2 className="font-display font-bold text-xl text-[var(--color-text-primary)] mb-4">
          Galería de fotos
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {items.map((item, index) => (
            <button
              key={item.mediaId}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-[var(--color-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={item.caption || `Foto ${index + 1}`}
            >
              <Image
                src={cldUrl(item.media.url, { w: 600, h: 450 })}
                alt={item.caption || `Foto ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn
                  size={24}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
              {/* Caption preview */}
              {item.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-white text-[11px] leading-tight line-clamp-2">{item.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Lightbox ────────────────────────────────────────────── */}
      {isOpen && currentItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto en tamaño completo"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Contenido */}
          <div className="relative z-10 flex flex-col items-center max-w-5xl w-full px-4 select-none">
            {/* Imagen */}
            <div className="relative w-full max-h-[80vh] flex items-center justify-center">
              <Image
                key={currentItem.mediaId}
                src={cldUrl(currentItem.media.url, { w: 1600, h: 1200 })}
                alt={currentItem.caption || `Foto ${lightboxIndex! + 1}`}
                width={currentItem.media.width || 1200}
                height={currentItem.media.height || 900}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
                priority
              />
            </div>

            {/* Caption */}
            {currentItem.caption && (
              <p className="mt-3 text-white/80 text-sm text-center max-w-2xl px-4 leading-snug">
                {currentItem.caption}
              </p>
            )}

            {/* Contador */}
            <p className="mt-2 text-white/50 text-xs">
              {lightboxIndex! + 1} / {items.length}
            </p>
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Flechas — solo si hay más de 1 foto */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goTo(lightboxIndex! - 1) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goTo(lightboxIndex! + 1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto siguiente"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Miniaturas — solo si hay más de 1 foto */}
          {items.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 px-4 flex-wrap justify-center max-w-xl">
              {items.map((item, index) => (
                <button
                  key={item.mediaId}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goTo(index) }}
                  className={`w-10 h-7 rounded overflow-hidden border-2 transition-all shrink-0 ${
                    index === lightboxIndex
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  <Image
                    src={cldUrl(item.media.url, { w: 80, h: 56 })}
                    alt=""
                    width={80}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
