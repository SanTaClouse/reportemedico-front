'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Megaphone, Plus, Trash2, Loader2, X, Check,
  MousePointerClick, ToggleLeft, ToggleRight,
  ChevronUp, ChevronDown, Info, Search, GripVertical, Pencil, Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createAd, updateAd, deleteAd,
  assignAdToSlot, removeAdFromSlot, reorderSlotAds,
  updateAdSlot, uploadImagenNoticia,
  type Ad, type AdSlot,
} from '@/lib/api'

// ─── LAYOUT DEL HOME ─────────────────────────────────────
// Define visualmente qué secciones y banners aparecen en el home

type LayoutItem =
  | { type: 'section'; label: string }
  | { type: 'banner'; slotName: string; label: string }

const HOMEPAGE_LAYOUT: LayoutItem[] = [
  { type: 'section', label: 'HERO' },
  { type: 'banner', slotName: 'banner_home_1', label: 'Banner 1' },
  { type: 'section', label: 'NOTICIAS DESTACADAS' },
  { type: 'banner', slotName: 'banner_home_2', label: 'Banner 2' },
  { type: 'section', label: 'ACTUALIDAD' },
  { type: 'banner', slotName: 'banner_home_3', label: 'Banner 3' },
  { type: 'section', label: 'ARTÍCULOS MÉDICOS' },
  { type: 'banner', slotName: 'banner_home_4', label: 'Banner 4' },
  { type: 'section', label: 'PODCAST' },
  { type: 'banner', slotName: 'banner_home_5', label: 'Banner 5' },
  { type: 'section', label: 'EDICIONES IMPRESAS' },
  { type: 'banner', slotName: 'banner_home_6', label: 'Banner 6' },
  { type: 'section', label: 'SOBRE NOSOTROS' },
]

interface Props {
  initialAds: Ad[]
  initialSlots: AdSlot[]
  token: string
}

const EMPTY_FORM = { title: '', imageUrl: '', link: '', isActive: true as boolean }

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1'

export default function PublicidadClient({ initialAds, initialSlots, token }: Props) {
  const [ads, setAds] = useState(initialAds)
  const [slots, setSlots] = useState(initialSlots)
  const [search, setSearch] = useState('')
  const [showAdForm, setShowAdForm] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [adForm, setAdForm] = useState(EMPTY_FORM)
  const [savingAd, setSavingAd] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [assigningKey, setAssigningKey] = useState<string | null>(null) // `${adId}-${slotId}`

  // ─── HELPERS ──────────────────────────────────────────

  const getSlot = (slotName: string) => slots.find((s) => s.name === slotName)

  const getSlotAds = (slotName: string) => {
    const slot = getSlot(slotName)
    if (!slot?.assignments) return []
    return [...slot.assignments].sort((a, b) => a.order - b.order)
  }

  const isAdInSlot = (adId: string, slotName: string) =>
    getSlot(slotName)?.assignments?.some((a) => a.ad.id === adId) ?? false

  // ─── IMAGE UPLOAD ─────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const { url } = await uploadImagenNoticia(file, token)
      setAdForm((f) => ({ ...f, imageUrl: url }))
      toast.success('Imagen subida')
    } catch (err: any) {
      toast.error(err.message || 'Error al subir imagen')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  // ─── AD CRUD ──────────────────────────────────────────

  const openCreateAd = () => {
    setEditingAd(null)
    setAdForm(EMPTY_FORM)
    setShowAdForm(true)
  }

  const openEditAd = (ad: Ad) => {
    setEditingAd(ad)
    setAdForm({ title: ad.title, imageUrl: ad.imageUrl, link: ad.link, isActive: ad.isActive })
    setShowAdForm(true)
  }

  const closeAdForm = () => {
    setShowAdForm(false)
    setEditingAd(null)
    setAdForm(EMPTY_FORM)
  }

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adForm.title || !adForm.imageUrl || !adForm.link) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    setSavingAd(true)
    const toastId = toast.loading(editingAd ? 'Guardando cambios...' : 'Creando anuncio...')
    try {
      if (editingAd) {
        const updated = await updateAd(editingAd.id, adForm, token)
        setAds((prev) => prev.map((a) => (a.id === editingAd.id ? { ...a, ...updated } : a)))
        // Sincronizar preview en slots
        setSlots((prev) =>
          prev.map((s) => ({
            ...s,
            assignments: s.assignments?.map((a) =>
              a.ad.id === editingAd.id
                ? { ...a, ad: { ...a.ad, title: updated.title, imageUrl: updated.imageUrl, isActive: updated.isActive } }
                : a,
            ),
          })),
        )
        toast.success('Anuncio actualizado', { id: toastId })
      } else {
        const created = await createAd(adForm, token)
        setAds((prev) => [created, ...prev])
        toast.success('Anuncio creado', { id: toastId })
      }
      closeAdForm()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar', { id: toastId })
    } finally {
      setSavingAd(false)
    }
  }

  const handleToggleAd = async (ad: Ad) => {
    const toastId = toast.loading(ad.isActive ? 'Desactivando...' : 'Activando...')
    try {
      const updated = await updateAd(ad.id, { isActive: !ad.isActive }, token)
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: updated.isActive } : a)))
      setSlots((prev) =>
        prev.map((s) => ({
          ...s,
          assignments: s.assignments?.map((a) =>
            a.ad.id === ad.id ? { ...a, ad: { ...a.ad, isActive: updated.isActive } } : a,
          ),
        })),
      )
      toast.success(updated.isActive ? 'Activado' : 'Desactivado', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error', { id: toastId })
    }
  }

  const handleDeleteAd = (ad: Ad) => {
    toast.warning(`¿Eliminar el anuncio "${ad.title}"?`, {
      description: 'Se quitará de todos los banners donde aparece.',
      action: { label: 'Eliminar', onClick: () => confirmDeleteAd(ad) },
      cancel: { label: 'Cancelar', onClick: () => { } },
      duration: 8000,
    })
  }

  const confirmDeleteAd = async (ad: Ad) => {
    const toastId = toast.loading('Eliminando...')
    try {
      await deleteAd(ad.id, token)
      setAds((prev) => prev.filter((a) => a.id !== ad.id))
      setSlots((prev) =>
        prev.map((s) => ({
          ...s,
          assignments: s.assignments?.filter((a) => a.ad.id !== ad.id).map((a, i) => ({ ...a, order: i })),
        })),
      )
      toast.success('Anuncio eliminado', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error', { id: toastId })
    }
  }

  // ─── DRAG AND DROP ────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, adId: string) => {
    e.dataTransfer.setData('adId', adId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent, slotName: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverSlot(slotName)
  }

  const handleDrop = async (e: React.DragEvent, slotName: string) => {
    e.preventDefault()
    setDragOverSlot(null)
    const adId = e.dataTransfer.getData('adId')
    if (!adId) return

    if (isAdInSlot(adId, slotName)) {
      toast.info('Este anuncio ya está asignado a ese banner')
      return
    }

    const slot = getSlot(slotName)
    if (!slot) {
      toast.error('Slot no encontrado — corré el seed del backend')
      return
    }

    const key = `${adId}-${slot.id}`
    setAssigningKey(key)
    try {
      await assignAdToSlot(adId, slot.id, token)
      const ad = ads.find((a) => a.id === adId)
      if (!ad) return
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== slot.id) return s
          const freshAssignments = s.assignments ?? []
          return {
            ...s,
            assignments: [
              ...freshAssignments,
              {
                order: freshAssignments.length,
                ad: { id: ad.id, title: ad.title, imageUrl: ad.imageUrl, isActive: ad.isActive },
              },
            ],
          }
        }),
      )
      toast.success('Anuncio asignado al banner')
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar')
    } finally {
      setAssigningKey(null)
    }
  }

  // ─── REMOVE FROM SLOT ────────────────────────────────

  const handleRemoveFromSlot = async (adId: string, slotName: string) => {
    const slot = getSlot(slotName)
    if (!slot) return
    const toastId = toast.loading('Quitando del banner...')
    try {
      await removeAdFromSlot(adId, slot.id, token)
      setSlots((prev) =>
        prev.map((s) =>
          s.id !== slot.id
            ? s
            : {
              ...s,
              assignments: (s.assignments ?? [])
                .filter((a) => a.ad.id !== adId)
                .map((a, i) => ({ ...a, order: i })),
            },
        ),
      )
      toast.success('Quitado del banner', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Error', { id: toastId })
    }
  }

  // ─── REORDER WITHIN SLOT ─────────────────────────────

  const handleMoveAd = async (slotName: string, adId: string, direction: 'left' | 'right') => {
    const slot = getSlot(slotName)
    if (!slot) return

    const assignments = getSlotAds(slotName)
    const idx = assignments.findIndex((a) => a.ad.id === adId)
    if (idx < 0) return
    const newIdx = direction === 'left' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= assignments.length) return

    const reordered = [...assignments]
      ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    const orderedAdIds = reordered.map((a) => a.ad.id)

    // Optimistic
    setSlots((prev) =>
      prev.map((s) =>
        s.id !== slot.id ? s : { ...s, assignments: reordered.map((a, i) => ({ ...a, order: i })) },
      ),
    )

    try {
      await reorderSlotAds(slot.id, orderedAdIds, token)
    } catch {
      toast.error('Error al reordenar')
      // Revertir
      setSlots((prev) =>
        prev.map((s) => (s.id !== slot.id ? s : { ...s, assignments })),
      )
    }
  }

  // ─── DISPLAY MODE ─────────────────────────────────────

  const handleSetDisplayMode = async (slotName: string, mode: 'SINGLE' | 'STRIP') => {
    const slot = getSlot(slotName)
    if (!slot || slot.displayMode === mode) return
    const toastId = toast.loading('Actualizando modo...')
    try {
      await updateAdSlot(slot.id, { displayMode: mode }, token)
      setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, displayMode: mode } : s))
      toast.success(mode === 'STRIP' ? 'Modo Strip activado' : 'Modo Banner activado', { id: toastId })
    } catch {
      toast.error('Error al actualizar el modo', { id: toastId })
    }
  }

  // ─── RENDER ───────────────────────────────────────────

  const filteredAds = ads.filter((ad) =>
    ad.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Megaphone size={22} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Publicidad</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ── COLUMNA IZQUIERDA: Mapa del Home ───────── */}
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
            Posiciones en el Home — arrastrá anuncios desde el panel derecho
          </p>

          <div className="space-y-1.5">
            {HOMEPAGE_LAYOUT.map((item, idx) => {
              if (item.type === 'section') {
                return (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-center"
                  >
                    {item.label}
                  </div>
                )
              }

              // ── BANNER SLOT ──────────────────────────
              const slotAssignments = getSlotAds(item.slotName)
              const slot = getSlot(item.slotName)
              const isDragOver = dragOverSlot === item.slotName
              const isAssigning = slot ? assigningKey?.endsWith(`-${slot.id}`) : false

              const bannerNum = item.slotName.match(/\d+$/)?.[0] ?? '?'

              return (
                <div key={idx} className="flex gap-2 items-stretch">
                  {/* ── Chip numérico ── */}
                  <div className="flex-shrink-0 w-7 flex flex-col items-center justify-center pt-0.5">
                    <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border-2 transition-colors ${slotAssignments.length > 0
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}>
                      {bannerNum}
                    </span>
                  </div>

                  {/* ── Drop zone ── */}
                  <div
                    onDragOver={(e) => handleDragOver(e, item.slotName)}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={(e) => handleDrop(e, item.slotName)}
                    className={`relative flex-1 px-3 py-2.5 border-2 border-dashed rounded-xl transition-all ${isDragOver
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40'
                      }`}
                  >
                    {/* Overlay: selector de modo + spinner — no ocupa espacio vertical */}
                    <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1.5">
                      {isAssigning && <Loader2 size={11} className="animate-spin text-[var(--color-primary)]" />}
                      {!slot && <span className="text-[10px] text-amber-500 italic bg-[var(--color-surface)]/90 px-1.5 py-0.5 rounded">slot no encontrado — corré el seed</span>}
                      {slot && (
                        <div className="flex overflow-hidden rounded-md border border-[var(--color-border)] text-[10px] font-semibold select-none bg-[var(--color-surface)]/90 backdrop-blur">
                          <button
                            onClick={() => handleSetDisplayMode(item.slotName, 'SINGLE')}
                            className={`px-2.5 py-0.5 transition-colors ${(slot.displayMode ?? 'SINGLE') === 'SINGLE' ? 'bg-[var(--color-primary)] text-white' : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'}`}
                          >
                            Banner
                          </button>
                          <button
                            onClick={() => handleSetDisplayMode(item.slotName, 'STRIP')}
                            className={`px-2.5 py-0.5 border-l border-[var(--color-border)] transition-colors ${slot.displayMode === 'STRIP' ? 'bg-[var(--color-primary)] text-white' : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'}`}
                          >
                            Strip
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Previews de anuncios */}
                    {slotAssignments.length === 0 ? (
                      <p className="text-[11px] text-[var(--color-text-muted)] italic text-center py-3">
                        {isDragOver ? '↓ Soltá el anuncio aquí' : 'Sin anuncios — arrastrá uno desde la derecha'}
                      </p>
                    ) : slot?.displayMode === 'STRIP' ? (
                      // ── STRIP: logos en fila horizontal
                      <div className="flex flex-wrap gap-2 items-center py-1">
                        {slotAssignments.map((assignment, i) => {
                          const { ad } = assignment
                          return (
                            <div
                              key={ad.id}
                              className={`group relative rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex-shrink-0 ${!ad.isActive ? 'opacity-45' : ''}`}
                              style={{ width: '96px', height: '48px' }}
                            >
                              <Image src={ad.imageUrl} alt={ad.title} fill className="object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleMoveAd(item.slotName, ad.id, 'left')} disabled={i === 0} className="p-0.5 rounded bg-black/50 text-white hover:bg-black/75 disabled:opacity-25 transition-colors" title="Mover izquierda"><ChevronUp size={10} /></button>
                                <button onClick={() => handleMoveAd(item.slotName, ad.id, 'right')} disabled={i === slotAssignments.length - 1} className="p-0.5 rounded bg-black/50 text-white hover:bg-black/75 disabled:opacity-25 transition-colors" title="Mover derecha"><ChevronDown size={10} /></button>
                                <button onClick={() => handleRemoveFromSlot(ad.id, item.slotName)} className="p-0.5 rounded bg-black/50 text-white hover:bg-red-500/80 transition-colors" title="Quitar"><X size={10} /></button>
                              </div>
                              <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">#{i + 1}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      // ── SINGLE: preview full-width apilado
                      <div className="space-y-1.5">
                        {slotAssignments.map((assignment, i) => {
                          const { ad } = assignment
                          return (
                            <div
                              key={ad.id}
                              className={`group relative w-full rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] ${!ad.isActive ? 'opacity-45' : ''}`}
                              style={{ height: '64px' }}
                            >
                              <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors" />
                              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium px-4 text-center opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1 pointer-events-none">
                                {ad.title}
                              </span>
                              <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleMoveAd(item.slotName, ad.id, 'left')} disabled={i === 0} className="p-0.5 rounded bg-black/50 text-white hover:bg-black/75 disabled:opacity-25 transition-colors" title="Subir en rotación"><ChevronUp size={12} /></button>
                                <button onClick={() => handleMoveAd(item.slotName, ad.id, 'right')} disabled={i === slotAssignments.length - 1} className="p-0.5 rounded bg-black/50 text-white hover:bg-black/75 disabled:opacity-25 transition-colors" title="Bajar en rotación"><ChevronDown size={12} /></button>
                                <button onClick={() => handleRemoveFromSlot(ad.id, item.slotName)} className="p-0.5 rounded bg-black/50 text-white hover:bg-red-500/80 transition-colors" title="Quitar del banner"><X size={12} /></button>
                              </div>
                              <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                #{i + 1}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Overlay de drag */}
                    {isDragOver && (
                      <div className="absolute inset-0 rounded-xl border-2 border-[var(--color-primary)] pointer-events-none flex items-center justify-center">
                        <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] px-3 py-1 rounded-full shadow">
                          Soltar aquí
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── COLUMNA DERECHA: Panel de Anuncios ───────── */}
        <div className="xl:sticky xl:top-6 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Anuncios ({ads.length})
            </p>
            <button
              onClick={openCreateAd}
              className="flex items-center gap-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={13} />
              Nuevo
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar anuncios..."
              className={`${inputClass} pl-8 text-xs`}
            />
          </div>

          {/* Lista de anuncios */}
          <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-0.5">
            {filteredAds.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-xl">
                <Megaphone size={26} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">{ads.length === 0 ? 'No hay anuncios.' : 'Sin resultados.'}</p>
              </div>
            ) : (
              filteredAds.map((ad) => (
                <div
                  key={ad.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ad.id)}
                  className={`group flex items-center gap-2.5 p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all hover:border-[var(--color-primary)]/40 hover:shadow-sm select-none ${ad.isActive
                    ? 'bg-[var(--color-surface)] border-[var(--color-border)]'
                    : 'bg-[var(--color-surface-2)] border-[var(--color-border)] opacity-55'
                    }`}
                >
                  <GripVertical
                    size={13}
                    className="text-[var(--color-text-muted)] flex-shrink-0 opacity-30 group-hover:opacity-80"
                  />

                  {/* Thumbnail — ratio leaderboard */}
                  <div className="relative flex-shrink-0 rounded overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)]" style={{ width: '96px', height: '24px' }}>
                    <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)] truncate leading-tight">
                      {ad.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                        <MousePointerClick size={9} strokeWidth={1.5} />
                        {ad.clicks}
                      </span>
                      {(ad.assignments?.length ?? 0) > 0 && (
                        <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                          <Layers size={9} strokeWidth={1.5} />
                          {ad.assignments!.length} banner{ad.assignments!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones (visibles al hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleToggleAd(ad)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      title={ad.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {ad.isActive
                        ? <ToggleRight size={15} className="text-[var(--color-primary)]" />
                        : <ToggleLeft size={15} />}
                    </button>
                    <button
                      onClick={() => openEditAd(ad)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad)}
                      className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Guía de formatos */}
          <div className="flex items-start gap-2 p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl">
            <Info size={13} className="flex-shrink-0 mt-0.5 text-[var(--color-primary)]" />
            <p className="text-[11px] text-[var(--color-text-muted)] leading-snug">
              <strong className="text-[var(--color-text-secondary)]">Modo Banner:</strong>{' '}
              1600 × 120 px (proporción 40:3) · JPG, PNG o WebP · en móvil la card ajusta
              su alto al de la imagen, en desktop llega a ~117 px · rota aleatoriamente si hay varios.{' '}
              <strong className="text-[var(--color-text-secondary)]">Modo Strip:</strong>{' '}
              360 × 140 px · PNG con fondo transparente · todos los logos se muestran en marquee continuo.
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL: Crear / Editar anuncio ─────────── */}
      {showAdForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                {editingAd ? 'Editar anuncio' : 'Nuevo anuncio'}
              </h2>
              <button
                onClick={closeAdForm}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className={labelClass}>Título *</label>
                <input
                  type="text"
                  value={adForm.title}
                  onChange={(e) => setAdForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Banner Clínica San Rafael"
                  className={inputClass}
                  required
                />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                  Solo visible en el panel de administración.
                </p>
              </div>

              {/* Imagen */}
              <div>
                <label className={labelClass}>Imagen del banner *</label>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-1.5">
                  Banner: <strong>1600 × 120 px</strong> (proporción 40:3) · Strip: <strong>360 × 140 px</strong> PNG transparente · JPG, PNG o WebP · máx. 5 MB
                </p>
                <div className="flex gap-2 items-start">
                  <input
                    type="url"
                    value={adForm.imageUrl}
                    onChange={(e) => setAdForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className={inputClass}
                  />
                  <label className="flex-shrink-0 flex items-center gap-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--color-border)] transition-colors whitespace-nowrap">
                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Subir
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {adForm.imageUrl && (
                  <div className="mt-2 relative h-16 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    <Image src={adForm.imageUrl} alt="Preview" fill className="object-contain" />
                  </div>
                )}
              </div>

              {/* Link */}
              <div>
                <label className={labelClass}>URL de destino *</label>
                <input
                  type="url"
                  value={adForm.link}
                  onChange={(e) => setAdForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="https://..."
                  className={inputClass}
                  required
                />
              </div>

              {/* Activo */}
              <div>
                <button
                  type="button"
                  onClick={() => setAdForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
                >
                  {adForm.isActive
                    ? <ToggleRight size={22} className="text-[var(--color-primary)]" />
                    : <ToggleLeft size={22} className="text-[var(--color-text-muted)]" />}
                  {adForm.isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingAd}
                  className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingAd ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  {editingAd ? 'Guardar cambios' : 'Crear anuncio'}
                </button>
                <button
                  type="button"
                  onClick={closeAdForm}
                  className="px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
