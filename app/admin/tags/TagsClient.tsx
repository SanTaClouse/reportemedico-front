'use client'

import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag as TagIcon, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { createTag, updateTag, deleteTag, approveSpecialty, rejectSpecialty, type Tag, type PendingSpecialty } from '@/lib/api'

interface Props {
  initialTags: Tag[]
  initialPendingSpecialties: PendingSpecialty[]
  token: string
}

export default function TagsClient({ initialTags, initialPendingSpecialties, token }: Props) {
  const [tags, setTags] = useState(initialTags)
  const [pending, setPending] = useState(initialPendingSpecialties)
  const [newTag, setNewTag] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [processingKey, setProcessingKey] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const inputClass =
    'flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'

  // ─── Crear ──────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newTag.trim()
    if (!name) return

    const toastId = toast.loading('Creando tag...')
    setCreating(true)
    try {
      const tag = await createTag(name, token)
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setNewTag('')
      toast.success(`Tag "${tag.name}" creado`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el tag', { id: toastId })
    } finally {
      setCreating(false)
    }
  }

  // ─── Editar ──────────────────────────────────────────

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditValue(tag.name)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (id: string) => {
    const name = editValue.trim()
    if (!name) return
    const original = tags.find((t) => t.id === id)
    if (original?.name === name) { cancelEdit(); return }

    setSavingId(id)
    const toastId = toast.loading('Guardando...')
    try {
      const updated = await updateTag(id, name, token)
      setTags((prev) =>
        prev.map((t) => (t.id === id ? updated : t)).sort((a, b) => a.name.localeCompare(b.name)),
      )
      cancelEdit()
      toast.success(`Tag renombrado a "${updated.name}"`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar', { id: toastId })
    } finally {
      setSavingId(null)
    }
  }

  // ─── Especialidades pendientes ───────────────────────

  const handleApprove = async (item: PendingSpecialty) => {
    const key = `${item.articleId}::${item.specialtyName}`
    setProcessingKey(key)
    const toastId = toast.loading(`Aprobando "${item.specialtyName}"...`)
    try {
      await approveSpecialty(item.articleId, item.specialtyName, token)
      setPending((prev) => prev.filter((p) => !(p.articleId === item.articleId && p.specialtyName === item.specialtyName)))
      toast.success(`Tag "${item.specialtyName}" creado y vinculado al artículo`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al aprobar', { id: toastId })
    } finally {
      setProcessingKey(null)
    }
  }

  const handleReject = async (item: PendingSpecialty) => {
    const key = `${item.articleId}::${item.specialtyName}`
    setProcessingKey(key)
    const toastId = toast.loading(`Rechazando "${item.specialtyName}"...`)
    try {
      await rejectSpecialty(item.articleId, item.specialtyName, token)
      setPending((prev) => prev.filter((p) => !(p.articleId === item.articleId && p.specialtyName === item.specialtyName)))
      toast.success(`Propuesta "${item.specialtyName}" rechazada`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al rechazar', { id: toastId })
    } finally {
      setProcessingKey(null)
    }
  }

  // ─── Eliminar ────────────────────────────────────────

  const handleDelete = (tag: Tag) => {
    toast.warning(`¿Eliminar el tag "${tag.name}"?`, {
      description: 'Se desvinculará de todos los artículos.',
      action: {
        label: 'Eliminar',
        onClick: () => confirmDelete(tag),
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {},
      },
      duration: 8000,
    })
  }

  const confirmDelete = async (tag: Tag) => {
    setDeletingId(tag.id)
    const toastId = toast.loading(`Eliminando "${tag.name}"...`)
    try {
      await deleteTag(tag.id, token)
      setTags((prev) => prev.filter((t) => t.id !== tag.id))
      toast.success(`Tag "${tag.name}" eliminado`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar', { id: toastId })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <TagIcon size={22} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Tags</h1>
        <span className="ml-auto text-sm text-[var(--color-text-muted)]">{tags.length} tags</span>
      </div>

      {/* Especialidades pendientes */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} strokeWidth={1.5} className="text-amber-500" />
            <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
              Especialidades propuestas por médicos
            </h2>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {pending.length}
            </span>
          </div>
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl overflow-hidden dark:bg-amber-900/10 dark:border-amber-800">
            <table className="w-full text-sm">
              <thead className="bg-amber-100/60 border-b border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Especialidad propuesta</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 hidden sm:table-cell">Artículo origen</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 hidden md:table-cell">Autor</th>
                  <th className="px-4 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-amber-800/40">
                {pending.map((item) => {
                  const key = `${item.articleId}::${item.specialtyName}`
                  const isProcessing = processingKey === key
                  return (
                    <tr key={key} className="hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-[var(--color-text-primary)]">{item.specialtyName}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-text-muted)] text-xs hidden sm:table-cell max-w-[180px] truncate">
                        {item.articleTitle}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-text-muted)] text-xs hidden md:table-cell">
                        {item.authorName}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={isProcessing}
                            title="Aprobar — crea el tag y lo vincula al artículo"
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium transition-colors disabled:opacity-40"
                          >
                            {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            disabled={isProcessing}
                            title="Rechazar"
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-40"
                          >
                            <X size={12} />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crear */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Nombre del nuevo tag"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={creating || !newTag.trim()}
          className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={16} />}
          Crear
        </button>
      </form>

      {/* Lista */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        {tags.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">
            <TagIcon size={36} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay tags. Crea el primero.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden sm:table-cell">Artículos</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-4 py-2.5">
                    {editingId === tag.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSave(tag.id) }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="flex-1 px-2 py-1 border border-[var(--color-primary)] rounded-md text-sm focus:outline-none bg-[var(--color-surface)]"
                        />
                        <button
                          onClick={() => handleSave(tag.id)}
                          disabled={savingId === tag.id}
                          className="text-green-600 hover:text-green-700 disabled:opacity-40"
                          title="Guardar"
                        >
                          {savingId === tag.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Check size={14} strokeWidth={2.5} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-[var(--color-text-muted)] hover:text-red-500"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-[var(--color-text-primary)]">{tag.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)] text-xs font-mono">{tag.slug}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)] hidden sm:table-cell">
                    {(tag as any)._count?.articles ?? 0}
                  </td>
                  <td className="px-4 py-2.5">
                    {editingId !== tag.id && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => startEdit(tag)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                          title="Renombrar"
                        >
                          <Pencil size={14} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag)}
                          disabled={deletingId === tag.id}
                          className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-30"
                          title="Eliminar"
                        >
                          {deletingId === tag.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} strokeWidth={1.5} />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
