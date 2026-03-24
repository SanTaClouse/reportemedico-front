'use client'

import { useState } from 'react'
import { X, Loader2, AlertCircle, LayoutTemplate, ImageOff } from 'lucide-react'
import type { HomeData } from '@/lib/api'
import { RELEVANCE_LIMITS } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ── Mini-cards ────────────────────────────────────────────

function HeroCard({ article }: { article: any }) {
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[var(--color-surface-3)]">
      {article.featuredImage
        ? <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <span className="inline-block mb-1 text-[8px] font-bold uppercase tracking-widest text-white bg-[var(--color-primary)] px-1.5 py-0.5 rounded">
          HERO
        </span>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-snug">{article.title}</p>
        {article.authorName && (
          <p className="text-white/60 text-[10px] mt-0.5">{article.authorName}</p>
        )}
      </div>
    </div>
  )
}

function LeadCard({ article }: { article: any }) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-[var(--color-surface-3)] h-full min-h-[130px]">
      {article.featuredImage
        ? <img src={article.featuredImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0 bg-[var(--color-surface-3)]" />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <span className="inline-block mb-1 text-[8px] font-bold uppercase tracking-widest text-white bg-blue-600 px-1.5 py-0.5 rounded">
          LEAD
        </span>
        <p className="text-white text-[11px] font-semibold line-clamp-3 leading-snug">{article.title}</p>
      </div>
    </div>
  )
}

function BigCard({ article }: { article: any }) {
  return (
    <div className="flex gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
      <div className="w-16 h-12 rounded flex-shrink-0 overflow-hidden bg-[var(--color-surface-3)]">
        {article.featuredImage
          ? <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={10} className="text-[var(--color-text-muted)]" />
            </div>
        }
      </div>
      <div className="min-w-0">
        <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wide">Big</span>
        <p className="text-[10px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug mt-0.5">
          {article.title}
        </p>
      </div>
    </div>
  )
}

function SmallCard({ article }: { article: any }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden">
      <div className="w-full h-10 bg-[var(--color-surface-3)] overflow-hidden">
        {article.featuredImage &&
          <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
        }
      </div>
      <p className="text-[9px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug p-1.5">
        {article.title}
      </p>
    </div>
  )
}

function ActualidadCard({ article }: { article: any }) {
  return (
    <div className="flex gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1.5">
      <div className="w-10 h-8 rounded flex-shrink-0 overflow-hidden bg-[var(--color-surface-3)]">
        {article.featuredImage &&
          <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
        }
      </div>
      <p className="text-[9px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
        {article.title}
      </p>
    </div>
  )
}

function MedicalCard({ article }: { article: any }) {
  return (
    <div className="flex gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
      <div className="w-12 h-10 rounded flex-shrink-0 overflow-hidden bg-[var(--color-surface-3)]">
        {article.featuredImage
          ? <img src={article.featuredImage} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={9} className="text-[var(--color-text-muted)]" />
            </div>
        }
      </div>
      <div className="min-w-0">
        <span className="text-[8px] font-bold text-green-700 uppercase tracking-wide">Médico</span>
        <p className="text-[10px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug mt-0.5">
          {article.title}
        </p>
      </div>
    </div>
  )
}

function EmptySlot({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] text-[9px] text-[var(--color-text-muted)] ${className}`}>
      {label}
    </div>
  )
}

function SlotLabel({ label, count, max }: { label: string; count: number; max: number }) {
  const full = count >= max
  const empty = count === 0
  const badgeColor = empty
    ? 'bg-red-100 text-red-600'
    : full
      ? 'bg-green-100 text-green-700'
      : 'bg-amber-100 text-amber-700'
  return (
    <div className="flex items-center gap-2 mb-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
        {count}/{max}
      </span>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────

export default function HomePreviewModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HomeData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`${API_URL}/articles/home`, { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar la vista previa')
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const openPreview = () => { setOpen(true); load() }
  const close = () => setOpen(false)

  return (
    <>
      <button
        onClick={openPreview}
        className="inline-flex items-center gap-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <LayoutTemplate size={15} strokeWidth={1.5} />
        Vista previa
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
              <div>
                <h2 className="font-display font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                  <LayoutTemplate size={15} className="text-[var(--color-primary)]" />
                  Vista previa del Inicio
                </h2>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Datos en tiempo real · sin caché
                </p>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 size={22} className="animate-spin text-[var(--color-primary)]" />
                  <p className="text-xs text-[var(--color-text-muted)]">Cargando datos del home...</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              {data && !loading && (() => {
                const lead   = data.lead ?? null
                const big1   = data.bigFeatured?.[0] ?? null
                const big2   = data.bigFeatured?.[1] ?? null
                const small  = data.smallFeatured ?? []
                const actualidad      = data.actualidad ?? []
                const medicalArticles = data.medicalArticles ?? []

                return (
                  <>
                    {/* ── HERO ── */}
                    <div>
                      <SlotLabel label="Hero" count={data.hero ? 1 : 0} max={RELEVANCE_LIMITS[1]} />
                      {data.hero
                        ? <HeroCard article={data.hero} />
                        : <EmptySlot label="Sin artículo hero — asigná relevancia 1" className="h-36" />
                      }
                    </div>

                    {/* ── NOTICIAS DESTACADAS ── */}
                    <div>
                      <SlotLabel
                        label="Noticias Destacadas"
                        count={[lead, big1, big2, ...small].filter(Boolean).length}
                        max={RELEVANCE_LIMITS[2] + RELEVANCE_LIMITS[3] + RELEVANCE_LIMITS[4]}
                      />

                      {/* Lead + Big (2-col) */}
                      <div className="grid grid-cols-[2fr_1fr] gap-2 mb-2">
                        {/* Lead — izquierda, altura = big1+big2+gap */}
                        {lead
                          ? <LeadCard article={lead} />
                          : <EmptySlot label="Lead vacío" className="min-h-[130px]" />
                        }

                        {/* Big — derecha, stacked */}
                        <div className="flex flex-col gap-2">
                          {big1
                            ? <BigCard article={big1} />
                            : <EmptySlot label="Big 1" className="h-[58px]" />
                          }
                          {big2
                            ? <BigCard article={big2} />
                            : <EmptySlot label="Big 2" className="h-[58px]" />
                          }
                        </div>
                      </div>

                      {/* Small — 4-col grid */}
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                          Small Destacadas ({small.length}/{RELEVANCE_LIMITS[4]})
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {small.map((a: any) => <SmallCard key={a.id} article={a} />)}
                          {Array.from({ length: Math.max(0, RELEVANCE_LIMITS[4] - small.length) }).map((_, i) => (
                            <EmptySlot key={i} label="Vacío" className="h-[60px]" />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── ACTUALIDAD ── */}
                    <div>
                      <SlotLabel label="Actualidad" count={actualidad.length} max={RELEVANCE_LIMITS[5]} />
                      {actualidad.length > 0
                        ? (
                          <div className="grid grid-cols-3 gap-1.5">
                            {actualidad.map((a: any) => <ActualidadCard key={a.id} article={a} />)}
                          </div>
                        )
                        : <EmptySlot label="Sin artículos en Actualidad — asigná relevancia 5" className="h-16" />
                      }
                    </div>

                    {/* ── ARTÍCULOS MÉDICOS ── */}
                    {medicalArticles.length > 0 && (
                      <div>
                        <SlotLabel label="Artículos Médicos" count={medicalArticles.length} max={3} />
                        <div className="grid grid-cols-3 gap-1.5">
                          {medicalArticles.slice(0, 3).map((a: any) => (
                            <MedicalCard key={a.id} article={a} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {/* Footer */}
            {!loading && (data || error) && (
              <div className="px-5 py-3 border-t border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
                <button
                  onClick={load}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  ↺ Actualizar
                </button>
                <a
                  href="/"
                  target="_blank"
                  className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                >
                  Abrir home en otra pestaña →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
