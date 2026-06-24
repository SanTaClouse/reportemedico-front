'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Code2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  type PrintEdition,
  createPrintEdition,
  updatePrintEdition,
  deletePrintEdition,
} from '@/lib/api'
import { formatDateShort, embedUrlToDirectUrl, issuuCoverUrl } from '@/lib/utils'

const triggerRevalidate = () => fetch('/api/revalidate', { method: 'POST' })

interface Props {
  editions: PrintEdition[]
  token: string
}

type FormData = {
  editionNumber: string
  title: string
  coverImage: string
  issuuUrl: string
  publishedAt: string
  isVisible: boolean
}

const emptyForm: FormData = {
  editionNumber: '',
  title: '',
  coverImage: '',
  issuuUrl: '',
  publishedAt: new Date().toISOString().split('T')[0],
  isVisible: true,
}

/** Extrae el src del iframe desde el código embed de Issuu */
function extractIssuuEmbedSrc(embedCode: string): string | null {
  const match = embedCode.match(/src="([^"]*e\.issuu\.com\/embed[^"]*)"/i)
  return match ? match[1] : null
}

/** Extrae el atributo title del iframe del embed de Issuu */
function extractIssuuTitle(embedCode: string): string | null {
  const match = embedCode.match(/title="([^"]+)"/i)
  return match ? match[1] : null
}

/** Extrae parámetros d= y u= del embed src (query string o hash) */
function extractIssuuParams(embedSrc: string): { docName: string; username: string } | null {
  try {
    const url = new URL(embedSrc)
    let docName = url.searchParams.get('d')
    let username = url.searchParams.get('u')
    if (!docName || !username) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
      docName = docName ?? hashParams.get('d')
      username = username ?? hashParams.get('u')
    }
    return docName && username ? { docName, username } : null
  } catch {
    return null
  }
}

/** Construye la URL del thumbnail de portada (página 1) a partir del embed src */
function extractIssuuThumbnail(embedSrc: string): string | null {
  const params = extractIssuuParams(embedSrc)
  return params
    ? `https://image.isu.pub/${params.username}/${params.docName}/jpg/page_1.jpg`
    : null
}

/**
 * Extrae el número de edición del nombre del documento de Issuu.
 * Soporta patrones como: ed-13, ed_13, ed-15-web, ED-13, etc.
 */
function extractEditionNumber(embedSrc: string): number | null {
  const params = extractIssuuParams(embedSrc)
  if (!params) return null
  const match = params.docName.match(/ed[-_](\d+)/i)
  return match ? parseInt(match[1], 10) : null
}



export default function EdicionesClient({ editions: initial, token }: Props) {
  const [editions, setEditions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [embedCode, setEmbedCode] = useState('')
  const [embedError, setEmbedError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  // Autofill flash — campos que se acaban de completar automáticamente
  const [flashingFields, setFlashingFields] = useState<Set<string>>(new Set())
  const flashTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const flashField = (key: string) => {
    setFlashingFields((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    if (flashTimeouts.current[key]) clearTimeout(flashTimeouts.current[key])
    flashTimeouts.current[key] = setTimeout(() => {
      setFlashingFields((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }, 1200)
  }

  const handleEdit = (edition: PrintEdition) => {
    setEditingId(edition.id)
    setForm({
      editionNumber: String(edition.editionNumber),
      title: edition.title,
      coverImage: edition.coverImage,
      issuuUrl: edition.issuuUrl,
      publishedAt: edition.publishedAt.split('T')[0],
      isVisible: edition.isVisible,
    })
    setEmbedCode('')
    setEmbedError('')
    setShowForm(true)
    setError('')
  }

  const handleNew = () => {
    const isDirty = showForm && (form.title || form.issuuUrl || embedCode)
    if (isDirty) {
      toast.warning('¿Descartar el formulario actual?', {
        description: 'Los datos no guardados se perderán.',
        action: {
          label: 'Descartar',
          onClick: () => openNewForm(),
        },
        cancel: { label: 'Cancelar', onClick: () => {} },
        duration: 8000,
      })
      return
    }
    openNewForm()
  }

  const openNewForm = () => {
    const nextNumber =
      editions.length > 0
        ? Math.max(...editions.map((e) => e.editionNumber)) + 1
        : 1
    setEditingId(null)
    setForm({ ...emptyForm, editionNumber: String(nextNumber) })
    setEmbedCode('')
    setEmbedError('')
    setShowForm(true)
    setError('')
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setEmbedCode('')
    setEmbedError('')
    setError('')
  }

  const handleEmbedCodeChange = (value: string) => {
    setEmbedCode(value)
    if (!value.trim()) {
      setEmbedError('')
      return
    }
    const src = extractIssuuEmbedSrc(value)
    if (src) {
      const titleFromEmbed = extractIssuuTitle(value)
      const editionNum = extractEditionNumber(src)
      setForm((f) => {
        const willSetTitle = !!titleFromEmbed && !f.title
        const willSetNumber = !!editionNum
        if (willSetTitle) flashField('title')
        if (willSetNumber) flashField('editionNumber')
        return {
          ...f,
          issuuUrl: src,
          ...(willSetTitle ? { title: titleFromEmbed! } : {}),
          ...(willSetNumber ? { editionNumber: String(editionNum) } : {}),
        }
      })
      setEmbedError('')

      // Obtener thumbnail via oEmbed oficial de Issuu
      const params = extractIssuuParams(src)
      if (params) {
        fetch(`/api/issuu-thumbnail?u=${params.username}&d=${params.docName}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.thumbnail) {
              setForm((f) => ({ ...f, coverImage: data.thumbnail }))
              flashField('coverImage')
              flashField('coverThumb')
            }
          })
          .catch(() => {})
      }
    } else {
      setEmbedError('No se encontró una URL de embed de Issuu válida en el código pegado.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.issuuUrl) {
      setError('Pega el código embed de Issuu para continuar.')
      return
    }
    setSaving(true)
    setError('')
    const toastId = toast.loading(editingId ? 'Guardando cambios...' : 'Creando edición...')
    try {
      const data = {
        editionNumber: Number(form.editionNumber),
        title: form.title,
        coverImage: form.coverImage,
        issuuUrl: form.issuuUrl,
        publishedAt: new Date(form.publishedAt).toISOString(),
        isVisible: form.isVisible,
      }
      if (editingId) {
        const updated = await updatePrintEdition(editingId, data, token)
        setEditions((prev) => prev.map((e) => (e.id === editingId ? updated : e)))
        toast.success(`"${updated.title}" actualizada`, { id: toastId })
      } else {
        const created = await createPrintEdition(data, token)
        setEditions((prev) => [created, ...prev].sort((a, b) => b.editionNumber - a.editionNumber))
        toast.success(`Edición #${created.editionNumber} creada`, { id: toastId })
      }
      triggerRevalidate()
      handleCancel()
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
      toast.error(err.message || 'Error al guardar', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (edition: PrintEdition) => {
    toast.warning(`¿Eliminar "${edition.title}"?`, {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          setDeletingId(edition.id)
          const toastId = toast.loading('Eliminando edición...')
          try {
            await deletePrintEdition(edition.id, token)
            setEditions((prev) => prev.filter((e) => e.id !== edition.id))
            triggerRevalidate()
            toast.success(`"${edition.title}" eliminada`, { id: toastId })
          } catch (err: any) {
            toast.error(err.message || 'Error al eliminar', { id: toastId })
          } finally {
            setDeletingId(null)
          }
        },
      },
      cancel: { label: 'Cancelar', onClick: () => {} },
      duration: 8000,
    })
  }

  const handleToggleVisibility = async (edition: PrintEdition) => {
    const toastId = toast.loading(edition.isVisible ? 'Ocultando edición...' : 'Haciendo visible...')
    try {
      const updated = await updatePrintEdition(edition.id, { isVisible: !edition.isVisible }, token)
      setEditions((prev) => prev.map((e) => (e.id === edition.id ? updated : e)))
      triggerRevalidate()
      toast.success(updated.isVisible ? `"${updated.title}" ahora es visible` : `"${updated.title}" ocultada`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar visibilidad', { id: toastId })
    }
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
      {children}
    </div>
  )

  const inputClass =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)]'

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={22} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">
            Ediciones Impresas
          </h1>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
        >
          <Plus size={16} /> Nueva edición
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6 space-y-4"
        >
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            {editingId ? 'Editar edición' : 'Nueva edición'}
          </h2>

          {/* PASO 1 — Embed code (jerarquizado) */}
          <div className="rounded-xl border-2 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold">
                1
              </span>
              <Code2 size={18} strokeWidth={1.5} className="text-[var(--color-primary)]" />
              <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                Pega el código embed de Issuu
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              En Issuu: abre la revista → <strong>Compartir</strong> → <strong>Embed</strong> → copia el código y pégalo aquí.
              El título, número de edición y la portada se completarán automáticamente.
            </p>
            <textarea
              rows={5}
              value={embedCode}
              onChange={(e) => handleEmbedCodeChange(e.target.value)}
              placeholder={'<div style="position:relative...">\n  <iframe src="https://e.issuu.com/embed.html?d=...&u=..."></iframe>\n</div>'}
              className={`${inputClass} font-mono text-xs resize-y bg-[var(--color-surface)]`}
              autoFocus
            />
            {embedError && (
              <p className="text-xs text-red-600">{embedError}</p>
            )}
            {form.issuuUrl && !embedError && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">✓ URL detectada:</span>
                <span className="text-xs text-green-600 dark:text-green-500 truncate flex-1 font-mono">
                  {form.issuuUrl}
                </span>
                <a
                  href={embedUrlToDirectUrl(form.issuuUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-green-700 hover:text-green-900"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* PASO 2 — Detalles (se autocompletan desde el embed) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-bold">
                2
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Detalles de la edición
              </h3>
              <span className="text-xs text-[var(--color-text-muted)]">
                (se autocompletan desde el embed — revisalos antes de guardar)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field(
                'Número de edición',
                <input
                  type="number"
                  required
                  min={1}
                  value={form.editionNumber}
                  onChange={(e) => setForm((f) => ({ ...f, editionNumber: e.target.value }))}
                  className={`${inputClass} ${flashingFields.has('editionNumber') ? 'autofill-flash' : ''}`}
                />,
              )}
              {field(
                'Título',
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Edición Enero 2025"
                  className={`${inputClass} ${flashingFields.has('title') ? 'autofill-flash' : ''}`}
                />,
              )}
              {field(
                'URL de portada',
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      required
                      value={form.coverImage}
                      onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                      placeholder="Se completará automáticamente desde el embed"
                      className={`${inputClass} ${flashingFields.has('coverImage') ? 'autofill-flash' : ''}`}
                    />
                  </div>
                  {form.coverImage && (
                    <Image
                      key={form.coverImage}
                      src={issuuCoverUrl(form.coverImage)}
                      alt="Portada"
                      width={48}
                      height={64}
                      className={`rounded border border-[var(--color-border)] object-cover flex-shrink-0 ${
                        flashingFields.has('coverThumb') ? 'autofill-thumb-pop' : ''
                      }`}
                      unoptimized
                    />
                  )}
                </div>,
              )}
              {field(
                'Fecha de publicación',
                <input
                  type="date"
                  required
                  value={form.publishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  className={inputClass}
                />,
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={form.isVisible}
              onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <label htmlFor="isVisible" className="text-sm text-[var(--color-text-primary)]">
              Visible en el sitio
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
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

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                #
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Título
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden md:table-cell">
                Fecha
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                Visible
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {editions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[var(--color-text-muted)]">
                  No hay ediciones registradas. Crea la primera.
                </td>
              </tr>
            ) : (
              editions.map((edition) => (
                <tr key={edition.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-4 py-3 font-bold text-[var(--color-primary)]">
                    #{edition.editionNumber}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">{edition.title}</p>
                    <a
                      href={embedUrlToDirectUrl(edition.issuuUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline mt-0.5"
                    >
                      Ver en Issuu <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)] hidden md:table-cell text-xs">
                    {formatDateShort(edition.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVisibility(edition)}
                      title={edition.isVisible ? 'Ocultar' : 'Mostrar'}
                      className={edition.isVisible ? 'text-green-600' : 'text-gray-400'}
                    >
                      {edition.isVisible ? (
                        <Eye size={16} strokeWidth={1.5} />
                      ) : (
                        <EyeOff size={16} strokeWidth={1.5} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(edition)}
                        title="Editar"
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <Pencil size={15} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(edition)}
                        disabled={deletingId === edition.id}
                        title="Eliminar"
                        className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
