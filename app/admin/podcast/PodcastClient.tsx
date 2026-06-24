'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Loader2, GripVertical, Info, X } from 'lucide-react'
import {
  type PodcastEpisode,
  createPodcastEpisode,
  updatePodcastEpisode,
  deletePodcastEpisode,
  reorderPodcastEpisodes,
} from '@/lib/api'
import { formatDateShort } from '@/lib/utils'

interface Props {
  episodes: PodcastEpisode[]
  token: string
}

type FormData = {
  title: string
  description: string
  youtubeUrl: string
  youtubeId: string
  isVisible: boolean
}

const emptyForm: FormData = {
  title: '',
  description: '',
  youtubeUrl: '',
  youtubeId: '',
  isVisible: true,
}

function extractYouTubeId(input: string): string | null {
  const s = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  try {
    const url = new URL(s)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('?')[0]
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2]
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2]
      return url.searchParams.get('v')
    }
  } catch {
    // not a URL
  }
  return null
}

async function triggerRevalidate() {
  await fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths: ['/podcast'] }),
  }).catch(() => {})
}

export default function PodcastClient({ episodes: initial, token }: Props) {
  const [episodes, setEpisodes] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [titleStatus, setTitleStatus] = useState<'idle' | 'fetching' | 'done'>('idle')
  const [highlighted, setHighlighted] = useState(false)
  const [showUrlInfo, setShowUrlInfo] = useState(false)
  const [flashTitle, setFlashTitle] = useState(false)
  const [flashThumb, setFlashThumb] = useState(false)

  // Pagination
  const PAGE_SIZE = 12
  const [currentPage, setCurrentPage] = useState(1)

  // Drag-and-drop state (indices are page-relative)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [reordering, setReordering] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const isDirty = useRef(false)

  useEffect(() => {
    if (!showForm) return
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setHighlighted(true)
    const t1 = setTimeout(() => setHighlighted(false), 1000)
    // Auto-focus URL input only on new episode
    const t2 = !editingId ? setTimeout(() => urlInputRef.current?.focus(), 150) : null
    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
  }, [showForm, editingId])

  const markDirty = () => { isDirty.current = true }

  const confirmDiscard = () => {
    if (!isDirty.current) return true
    return confirm('Hay cambios sin guardar. ¿Descartarlos?')
  }

  // ── Drag handlers ──────────────────────────────────────

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    const pageOffset = (currentPage - 1) * PAGE_SIZE
    const globalDrag = pageOffset + dragIndex
    const globalDrop = pageOffset + dropIndex

    const reordered = [...episodes]
    const [moved] = reordered.splice(globalDrag, 1)
    reordered.splice(globalDrop, 0, moved)

    const withOrder = reordered.map((ep, i) => ({ ...ep, order: i }))
    setEpisodes(withOrder)
    setDragIndex(null)
    setDragOverIndex(null)

    setReordering(true)
    try {
      await reorderPodcastEpisodes(withOrder.map((ep) => ({ id: ep.id, order: ep.order })), token)
      triggerRevalidate()
    } catch {
      // Revert on error
      setEpisodes(episodes)
      alert('Error al guardar el nuevo orden. Intenta de nuevo.')
    } finally {
      setReordering(false)
    }
  }

  // ── Form handlers ──────────────────────────────────────

  const handleYoutubeUrlChange = (value: string) => {
    markDirty()
    const id = extractYouTubeId(value)
    setForm((f) => {
      // Flash cuando recién se detecta un ID válido
      if (id && id !== f.youtubeId) {
        setFlashThumb(true)
        setTimeout(() => setFlashThumb(false), 1200)
      }
      return { ...f, youtubeUrl: value, youtubeId: id || '' }
    })
  }

  // Fetch title automatically when a valid YouTube ID is detected and title is empty
  useEffect(() => {
    if (!form.youtubeId || form.title) {
      setTitleStatus('idle')
      return
    }

    setTitleStatus('fetching')
    const controller = new AbortController()

    const run = async () => {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${form.youtubeId}&format=json`,
          { signal: controller.signal },
        )
        if (res.ok) {
          const data = await res.json()
          if (data.title) {
            setForm((f) => {
              if (f.title) return f
              // Dispara el flash solo cuando el título realmente se autocompleta
              setFlashTitle(true)
              setTimeout(() => setFlashTitle(false), 1200)
              return { ...f, title: data.title }
            })
            setTitleStatus('done')
            setTimeout(() => setTitleStatus('idle'), 3000)
            return
          }
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
      setTitleStatus('idle')
    }

    run()
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.youtubeId])

  const handleEdit = (ep: PodcastEpisode) => {
    if (!confirmDiscard()) return
    isDirty.current = false
    setEditingId(ep.id)
    setForm({
      title: ep.title,
      description: ep.description || '',
      youtubeUrl: `https://youtube.com/watch?v=${ep.youtubeId}`,
      youtubeId: ep.youtubeId,
      isVisible: ep.isVisible,
    })
    setShowForm(true)
    setError('')
  }

  const handleNew = () => {
    if (showForm && !confirmDiscard()) return
    isDirty.current = false
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  const handleCancel = () => {
    if (!confirmDiscard()) return
    isDirty.current = false
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data: Partial<PodcastEpisode> = {
        title: form.title,
        description: form.description || undefined,
        youtubeId: form.youtubeId,
        isVisible: form.isVisible,
        // New episodes go to the end
        ...(!editingId && { order: episodes.length }),
      }
      if (editingId) {
        const updated = await updatePodcastEpisode(editingId, data, token)
        setEpisodes((prev) => prev.map((e) => (e.id === editingId ? updated : e)))
      } else {
        const created = await createPodcastEpisode(data, token)
        setEpisodes((prev) => [...prev, created])
      }
      isDirty.current = false
      handleCancel()
      triggerRevalidate()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este episodio? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await deletePodcastEpisode(id, token)
      // Reindex remaining episodes
      const remaining = episodes
        .filter((e) => e.id !== id)
        .map((ep, i) => ({ ...ep, order: i }))
      setEpisodes(remaining)
      if (remaining.length > 0) {
        await reorderPodcastEpisodes(remaining.map((ep) => ({ id: ep.id, order: ep.order })), token)
      }
      triggerRevalidate()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleVisibility = async (ep: PodcastEpisode) => {
    try {
      const updated = await updatePodcastEpisode(ep.id, { isVisible: !ep.isVisible }, token)
      setEpisodes((prev) => prev.map((e) => (e.id === ep.id ? updated : e)))
      triggerRevalidate()
    } catch (err: any) {
      alert(err.message || 'Error al cambiar visibilidad')
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)]'

  const field = (label: string, children: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>}
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mic size={22} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Podcast</h1>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus size={16} /> Nuevo episodio
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          ref={formRef}
          onSubmit={handleSave}
          className={`bg-[var(--color-surface)] border-2 rounded-xl p-6 mb-6 space-y-5 transition-all duration-500 ${
            highlighted
              ? 'border-[var(--color-primary)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
              : 'border-[var(--color-border)]'
          }`}
        >
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            {editingId ? 'Editar episodio' : 'Nuevo episodio'}
          </h2>

          {/* ── URL de YouTube — campo principal ── */}
          <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* YouTube icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-red-600 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  URL del video de YouTube
                </span>
                <span className="text-xs text-red-500 font-medium">*</span>
              </div>

              {/* Info button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUrlInfo((v) => !v)}
                  className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Info size={14} />
                  <span className="hidden sm:inline">Formatos aceptados</span>
                </button>

                {showUrlInfo && (
                  <div className="absolute right-0 top-7 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-xl z-20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">Puedes pegar cualquiera de estos:</p>
                      <button type="button" onClick={() => setShowUrlInfo(false)}>
                        <X size={13} className="text-[var(--color-text-muted)]" />
                      </button>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        ['URL completa', 'youtube.com/watch?v=ID'],
                        ['URL corta', 'youtu.be/ID'],
                        ['Shorts', 'youtube.com/shorts/ID'],
                        ['Solo el ID', 'Ws2k9PxaYu4 (11 chars)'],
                      ].map(([label, example]) => (
                        <li key={label} className="text-xs">
                          <span className="font-medium text-[var(--color-text-secondary)]">{label}: </span>
                          <code className="text-[var(--color-primary)] bg-[var(--color-surface-2)] px-1 rounded">{example}</code>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)]">
                      El título se completa automático si lo dejas vacío.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="relative">
              <input
                ref={urlInputRef}
                type="text"
                required
                value={form.youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                placeholder="Pega la URL del video aquí…"
                className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] pr-10"
              />
              {titleStatus === 'fetching' && (
                <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]" />
              )}
            </div>

            {/* Thumbnail preview when ID detected */}
            {form.youtubeId ? (
              <div
                key={form.youtubeId}
                className={`flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 ${
                  flashThumb ? 'autofill-flash' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${form.youtubeId}/mqdefault.jpg`}
                  alt="Preview"
                  className={`w-20 h-12 rounded object-cover shrink-0 ${flashThumb ? 'autofill-thumb-pop' : ''}`}
                />
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">✓ Video detectado</p>
                  <code className="text-xs text-green-600 dark:text-green-500">{form.youtubeId}</code>
                </div>
              </div>
            ) : form.youtubeUrl ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No se pudo extraer un ID válido. Revisa el formato de la URL.
              </p>
            ) : null}
          </div>

          {/* ── Resto de campos ── */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Título</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => { markDirty(); setForm((f) => ({ ...f, title: e.target.value })) }}
              placeholder="Título del episodio"
              className={`${inputClass} ${flashTitle ? 'autofill-flash' : ''}`}
            />
            {titleStatus === 'fetching' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Loader2 size={11} className="animate-spin shrink-0" />
                Extrayendo título automáticamente…
              </p>
            )}
            {titleStatus === 'done' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 shrink-0">
                  <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".2"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Título extraído correctamente
              </p>
            )}
          </div>

          {field(
            'Descripción (opcional)',
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => { markDirty(); setForm((f) => ({ ...f, description: e.target.value })) }}
              placeholder="Breve descripción del episodio…"
              className={`${inputClass} resize-none`}
            />,
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="epVisible"
              checked={form.isVisible}
              onChange={(e) => { markDirty(); setForm((f) => ({ ...f, isVisible: e.target.checked })) }}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <label htmlFor="epVisible" className="text-sm text-[var(--color-text-primary)]">
              Visible en el sitio
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || !form.youtubeId}
              className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-[var(--color-text-secondary)] px-5 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Drag-and-drop hint */}
      {episodes.length > 1 && (
        <p className="text-xs text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
          <GripVertical size={12} />
          Arrastrá los episodios para cambiar el orden. El primero es el destacado en el inicio del sitio.
          {reordering && <span className="ml-1 text-[var(--color-primary)]">Guardando orden…</span>}
        </p>
      )}

      {/* Episode list */}
      {episodes.length === 0 && !showForm ? (
        <div className="text-center py-16 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <Mic size={40} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No hay episodios registrados</p>
          <p className="text-sm">Crea el primero con el botón "Nuevo episodio".</p>
        </div>
      ) : (() => {
        const pageOffset = (currentPage - 1) * PAGE_SIZE
        const totalPages = Math.ceil(episodes.length / PAGE_SIZE)
        const pageEpisodes = episodes.slice(pageOffset, pageOffset + PAGE_SIZE)
        return (
        <>
        <div className="space-y-2">
          {pageEpisodes.map((ep, index) => {
            const globalIndex = pageOffset + index
            const isFirstAfterHome = globalIndex === 4
            return (
            <div key={ep.id}>
            {isFirstAfterHome && (
              <div className="flex items-center gap-3 py-2 my-1">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full px-3 py-1 whitespace-nowrap">
                  Los anteriores aparecen en el inicio · Los siguientes solo en /podcast
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>
            )}
            <div
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={() => handleDrop(index)}
              className={`bg-[var(--color-surface)] border rounded-xl p-4 flex gap-3 items-center transition-all select-none ${
                dragIndex === index
                  ? 'opacity-40 scale-[0.98] border-dashed border-[var(--color-primary)]'
                  : dragOverIndex === index && dragIndex !== index
                  ? 'border-[var(--color-primary)] border-2 shadow-md'
                  : editingId === ep.id
                  ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))]'
                  : 'border-[var(--color-border)] cursor-grab active:cursor-grabbing'
              }`}
            >
              {/* Drag handle */}
              <div className="text-[var(--color-text-muted)] shrink-0 cursor-grab active:cursor-grabbing">
                <GripVertical size={18} strokeWidth={1.5} />
              </div>

              {/* Position badge */}
              <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
              }`}>
                {pageOffset + index + 1}
              </div>

              {/* Thumbnail */}
              <div className="shrink-0 w-20 h-14 rounded-lg overflow-hidden bg-[var(--color-surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ep.thumbnailUrl || `https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`}
                  alt={ep.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--color-text-primary)] leading-snug truncate">
                  {ep.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatDateShort(ep.publishedAt)}
                  </span>
                  {pageOffset + index === 0 && (
                    <span className="text-xs font-medium text-[var(--color-primary)]">★ Destacado</span>
                  )}
                  <a
                    href={`https://youtube.com/watch?v=${ep.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                  >
                    YouTube <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleVisibility(ep)}
                  title={ep.isVisible ? 'Ocultar' : 'Mostrar'}
                  className={ep.isVisible ? 'text-green-600' : 'text-gray-400'}
                >
                  {ep.isVisible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
                </button>
                <button
                  onClick={() => handleEdit(ep)}
                  title="Editar"
                  className={`transition-colors ${
                    editingId === ep.id
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  <Pencil size={15} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => handleDelete(ep.id)}
                  disabled={deletingId === ep.id}
                  title="Eliminar"
                  className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>
            </div>
          )})}
        </div>

        {/* Paginación admin */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-muted)]">
              {pageOffset + 1}–{Math.min(pageOffset + PAGE_SIZE, episodes.length)} de {episodes.length} episodios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-[var(--color-text-muted)] px-1">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
        </>
        )
      })()}
    </div>
  )
}
