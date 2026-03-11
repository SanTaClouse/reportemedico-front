'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Star, StarOff, Eye, EyeOff,
  X, Upload, Loader2, Users, GripVertical, Linkedin
} from 'lucide-react'
import {
  createCouncilMember,
  updateCouncilMember,
  deleteCouncilMember,
  uploadFotoConsejo,
} from '@/lib/api'
import type { CouncilMember } from '@/lib/api'

interface Props {
  initialMembers: CouncilMember[]
  token: string
}

const EMPTY_FORM = {
  name: '',
  role: '',
  photo: '',
  linkedinUrl: '',
  isFeatured: false,
  isVisible: true,
  order: 0,
}

export default function ConsejoMedicoClient({ initialMembers, token }: Props) {
  const [members, setMembers] = useState<CouncilMember[]>(initialMembers)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CouncilMember | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(m: CouncilMember) {
    setEditing(m)
    setForm({
      name: m.name,
      role: m.role,
      photo: m.photo ?? '',
      linkedinUrl: m.linkedinUrl ?? '',
      isFeatured: m.isFeatured,
      isVisible: m.isVisible,
      order: m.order,
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadFotoConsejo(file, token)
      setForm((f) => ({ ...f, photo: url }))
      toast.success('Foto subida correctamente')
    } catch {
      toast.error('Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error('Nombre y rol son obligatorios')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        photo: form.photo || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        isFeatured: form.isFeatured,
        isVisible: form.isVisible,
        order: form.order,
      }

      if (editing) {
        const updated = await updateCouncilMember(editing.id, payload, token)
        setMembers((prev) => {
          let list = prev.map((m) => (m.id === editing.id ? updated : m))
          // Si se marcó featured, quitar featured de los demás
          if (updated.isFeatured) {
            list = list.map((m) => (m.id !== updated.id ? { ...m, isFeatured: false } : m))
          }
          return list
        })
        toast.success('Miembro actualizado')
      } else {
        const created = await createCouncilMember(payload, token)
        setMembers((prev) => {
          let list = [...prev, created]
          if (created.isFeatured) {
            list = list.map((m) => (m.id !== created.id ? { ...m, isFeatured: false } : m))
          }
          return list.sort((a, b) => a.order - b.order)
        })
        toast.success('Miembro añadido')
      }
      closeModal()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}?`)) return
    setDeleting(id)
    try {
      await deleteCouncilMember(id, token)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success('Miembro eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  async function toggleVisible(m: CouncilMember) {
    try {
      const updated = await updateCouncilMember(m.id, { isVisible: !m.isVisible }, token)
      setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)))
    } catch {
      toast.error('Error al actualizar visibilidad')
    }
  }

  async function toggleFeatured(m: CouncilMember) {
    try {
      const updated = await updateCouncilMember(m.id, { isFeatured: !m.isFeatured }, token)
      setMembers((prev) => {
        let list = prev.map((x) => (x.id === m.id ? updated : x))
        if (updated.isFeatured) {
          list = list.map((x) => (x.id !== m.id ? { ...x, isFeatured: false } : x))
        }
        return list
      })
      toast.success(updated.isFeatured ? 'Marcado como destacado del HERO' : 'Quitado del HERO')
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const featured = members.find((m) => m.isFeatured)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] flex items-center gap-2">
            <Users size={24} strokeWidth={1.5} className="text-[var(--color-primary)]" />
            Consejo Médico Editorial
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {members.length} miembro{members.length !== 1 ? 's' : ''} · El destacado (⭐) aparece en el HERO de la página
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} strokeWidth={1.5} />
          Añadir miembro
        </button>
      </div>

      {/* Alert featured */}
      {featured && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
          <Star size={14} className="text-amber-500 flex-shrink-0" />
          <span>
            <strong>{featured.name}</strong> aparece actualmente en el HERO de la página pública.
          </span>
        </div>
      )}

      {/* Grid de miembros */}
      {members.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">
          <Users size={40} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
          <p>No hay miembros aún. Añade el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className={`relative group rounded-2xl border p-4 flex flex-col items-center text-center gap-2 transition-all ${
                m.isFeatured
                  ? 'border-amber-400 bg-amber-50'
                  : m.isVisible
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-60'
              }`}
            >
              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {m.isFeatured && (
                  <span className="bg-amber-400 text-white rounded-full p-0.5">
                    <Star size={10} />
                  </span>
                )}
                {!m.isVisible && (
                  <span className="bg-gray-400 text-white rounded-full p-0.5">
                    <EyeOff size={10} />
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleFeatured(m)}
                  title={m.isFeatured ? 'Quitar del HERO' : 'Poner en HERO'}
                  className="w-6 h-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-amber-50 transition-colors"
                >
                  {m.isFeatured ? <StarOff size={11} className="text-amber-500" /> : <Star size={11} className="text-amber-500" />}
                </button>
                <button
                  onClick={() => toggleVisible(m)}
                  title={m.isVisible ? 'Ocultar' : 'Mostrar'}
                  className="w-6 h-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {m.isVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button
                  onClick={() => openEdit(m)}
                  title="Editar"
                  className="w-6 h-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors"
                >
                  <Pencil size={11} className="text-blue-500" />
                </button>
                <button
                  onClick={() => handleDelete(m.id, m.name)}
                  title="Eliminar"
                  disabled={deleting === m.id}
                  className="w-6 h-6 bg-white border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting === m.id ? (
                    <Loader2 size={11} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={11} className="text-red-500" />
                  )}
                </button>
              </div>

              {/* Foto */}
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--color-surface-3)] ring-2 ring-[var(--color-border)] mt-2">
                {m.photo ? (
                  <Image src={m.photo} alt={m.name} fill className="object-cover object-top" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl font-display font-bold text-[var(--brand-navy)]/30">
                      {m.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-semibold text-xs text-[var(--color-text-primary)] leading-snug">{m.name}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{m.role}</p>
              </div>

              {m.linkedinUrl && (
                <a href={m.linkedinUrl} target="_blank" rel="noopener noreferrer" className="opacity-40 hover:opacity-100 transition-opacity">
                  <Linkedin size={12} className="text-blue-600" />
                </a>
              )}

              <span className="text-[10px] text-[var(--color-text-muted)]">orden: {m.order}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
              <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                {editing ? 'Editar miembro' : 'Añadir miembro'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-[var(--color-surface-2)] rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body modal */}
            <div className="p-5 space-y-4">
              {/* Foto */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-[var(--color-surface-3)] ring-2 ring-[var(--color-border)] cursor-pointer hover:ring-[var(--brand-gold)] transition-all"
                  onClick={() => fileRef.current?.click()}
                >
                  {form.photo ? (
                    <Image src={form.photo} alt="Preview" fill className="object-cover object-top" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {uploading ? (
                        <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
                      ) : (
                        <Upload size={20} className="text-[var(--color-text-muted)]" />
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.heic"
                  className="hidden"
                  onChange={handlePhoto}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-xs text-[var(--brand-electric)] hover:underline disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : form.photo ? 'Cambiar foto' : 'Subir foto'}
                </button>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Dr. Juan Pérez"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              {/* Rol / Especialidad */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Especialidad o Rol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="Cardióloga · Cardiólogo Pediatra"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  URL LinkedIn (opcional)
                </label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              {/* Orden */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Orden (menor = primero)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVisible}
                    onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">Visible en la página pública</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    ⭐ Destacar en el HERO de la página{' '}
                    <span className="text-[var(--color-text-muted)]">(solo uno a la vez)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex gap-3 p-5 border-t border-[var(--color-border)]">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Guardar cambios' : 'Añadir miembro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
