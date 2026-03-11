'use client'

import { useState } from 'react'
import { Mic, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import {
  type PodcastEpisode,
  createPodcastEpisode,
  updatePodcastEpisode,
  deletePodcastEpisode,
} from '@/lib/api'
import { formatDateShort } from '@/lib/utils'

interface Props {
  episodes: PodcastEpisode[]
  token: string
}

type FormData = {
  title: string
  description: string
  youtubeId: string
  thumbnailUrl: string
  order: string
  isVisible: boolean
}

const emptyForm: FormData = {
  title: '',
  description: '',
  youtubeId: '',
  thumbnailUrl: '',
  order: '0',
  isVisible: true,
}

export default function PodcastClient({ episodes: initial, token }: Props) {
  const [episodes, setEpisodes] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleEdit = (ep: PodcastEpisode) => {
    setEditingId(ep.id)
    setForm({
      title: ep.title,
      description: ep.description || '',
      youtubeId: ep.youtubeId,
      thumbnailUrl: ep.thumbnailUrl || '',
      order: String(ep.order),
      isVisible: ep.isVisible,
    })
    setShowForm(true)
    setError('')
  }

  const handleNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  const handleCancel = () => {
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
        thumbnailUrl: form.thumbnailUrl || undefined,
        order: Number(form.order),
        isVisible: form.isVisible,
      }
      if (editingId) {
        const updated = await updatePodcastEpisode(editingId, data, token)
        setEpisodes((prev) => prev.map((e) => (e.id === editingId ? updated : e)))
      } else {
        const created = await createPodcastEpisode(data, token)
        setEpisodes((prev) => [...prev, created].sort((a, b) => a.order - b.order))
      }
      handleCancel()
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
      setEpisodes((prev) => prev.filter((e) => e.id !== id))
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
    } catch (err: any) {
      alert(err.message || 'Error al cambiar visibilidad')
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)]'

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
      {children}
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
          onSubmit={handleSave}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            {editingId ? 'Editar episodio' : 'Nuevo episodio'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field(
              'Título',
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título del episodio"
                className={inputClass}
              />,
            )}
            {field(
              'YouTube ID',
              <div>
                <input
                  type="text"
                  required
                  value={form.youtubeId}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeId: e.target.value }))}
                  placeholder="Ej: dQw4w9WgXcQ"
                  className={inputClass}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  El ID está en la URL: youtube.com/watch?v=<strong>ID</strong>
                </p>
              </div>,
            )}
            {field(
              'URL de thumbnail (opcional)',
              <input
                type="url"
                value={form.thumbnailUrl}
                onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))}
                placeholder="https://... (se auto-genera si está vacío)"
                className={inputClass}
              />,
            )}
            {field(
              'Orden',
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className={inputClass}
              />,
            )}
          </div>

          {field(
            'Descripción (opcional)',
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Breve descripción del episodio..."
              className={`${inputClass} resize-none`}
            />,
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="epVisible"
              checked={form.isVisible}
              onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
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
              disabled={saving}
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

      {/* Grid / Table */}
      {episodes.length === 0 && !showForm ? (
        <div className="text-center py-16 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <Mic size={40} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No hay episodios registrados</p>
          <p className="text-sm">Crea el primero con el botón "Nuevo episodio".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep) => (
            <div
              key={ep.id}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex gap-4 items-start"
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-[var(--color-surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    ep.thumbnailUrl ||
                    `https://img.youtube.com/vi/${ep.youtubeId}/mqdefault.jpg`
                  }
                  alt={ep.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)] leading-snug">
                      {ep.title}
                    </p>
                    {ep.description && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                        {ep.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Orden: {ep.order}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDateShort(ep.publishedAt)}
                      </span>
                      <a
                        href={`https://youtube.com/watch?v=${ep.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Ver en YouTube <ExternalLink size={10} />
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
                      {ep.isVisible ? (
                        <Eye size={16} strokeWidth={1.5} />
                      ) : (
                        <EyeOff size={16} strokeWidth={1.5} />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(ep)}
                      title="Editar"
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
