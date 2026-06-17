'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Trash2, Upload, Loader2, Star, ChevronLeft, ChevronRight, RefreshCw, Crop } from 'lucide-react'
import { toast } from 'sonner'
import {
  uploadFotoGaleria,
  addGalleryImage,
  removeGalleryImage,
  reorderGallery,
  updateGalleryCaption,
  type GalleryItem,
} from '@/lib/api'
import { cldUrl, baseImageUrl, setImageCrop, type CropRegion } from '@/lib/cloudinary'
import { prepareImageForUpload } from '@/lib/image-process'

const ImageCropModal = dynamic(() => import('./ImageCropModal'), { ssr: false })

interface PhotosUploaderProps {
  /** URL de la portada (featuredImage del artículo, controlada por el editor) */
  featuredImage: string
  onFeaturedChange: (url: string) => void
  /** ID del artículo si ya existe; si falta se crea con ensureArticleId al subir */
  articleId?: string
  token: string
  initialItems?: GalleryItem[]
  /** Crea el borrador si todavía no existe y devuelve su ID (o null si no se pudo) */
  ensureArticleId: () => Promise<string | null>
}

/**
 * Gestor unificado de fotos de la noticia: portada + galería en una sola zona.
 *
 * Modelo: `items` son las fotos de la galería (filas Media). La portada es la
 * URL `featuredImage`. La foto cuya URL coincide con la portada se muestra como
 * tapa (badge "Portada") y se oculta del resto de la galería para no duplicarla.
 * "Hacer portada" solo cambia qué URL es la destacada: nada se pierde.
 */
export default function PhotosUploader({
  featuredImage,
  onFeaturedChange,
  articleId,
  token,
  initialItems = [],
  ensureArticleId,
}: PhotosUploaderProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const dropInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // La portada puede ser una foto de la galería (flujo nuevo) o una URL legada
  // que no está en items. En ambos casos se muestra como tapa y se excluye del grid.
  // Se compara por URL base porque la portada puede llevar un recuadre (#crop=...).
  const coverBase = baseImageUrl(featuredImage)
  const coverItem = items.find((i) => baseImageUrl(i.media.url) === coverBase) ?? null
  const galleryItems = items.filter((i) => baseImageUrl(i.media.url) !== coverBase)

  /** Sube una tanda de archivos a la galería. La primera se vuelve portada si no hay. */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      const id = articleId ?? (await ensureArticleId())
      if (!id) return // ensureArticleId ya avisó el motivo

      setUploading(true)
      let successCount = 0
      let coverAssigned = !!featuredImage

      for (const file of files) {
        try {
          const processed = await prepareImageForUpload(file)
          const altBase = file.name.replace(/\.[^/.]+$/, '')
          const media = await uploadFotoGaleria(processed, altBase, token)
          const item = await addGalleryImage(
            id,
            { mediaId: media.id, position: items.length + successCount },
            token,
          )
          setItems((prev) => [...prev, item])
          successCount++
          // La primera foto, si no había portada, se convierte en tapa
          if (!coverAssigned) {
            onFeaturedChange(item.media.url)
            coverAssigned = true
          }
        } catch (err) {
          toast.error(`Error al subir ${file.name}: ${(err as Error).message}`)
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'Foto agregada' : `${successCount} fotos agregadas`,
        )
      }
      setUploading(false)
    },
    [articleId, ensureArticleId, featuredImage, items.length, onFeaturedChange, token],
  )

  const onDropFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    uploadFiles(Array.from(fileList))
    if (dropInputRef.current) dropInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    onDropFiles(e.dataTransfer.files)
  }

  /** Reemplazar la portada subiendo una nueva imagen (la anterior, si era de galería, queda como foto normal). */
  const handleReplaceCover = async (file: File | undefined) => {
    if (!file) return
    const id = articleId ?? (await ensureArticleId())
    if (!id) return
    setUploading(true)
    try {
      const processed = await prepareImageForUpload(file)
      const media = await uploadFotoGaleria(processed, file.name.replace(/\.[^/.]+$/, ''), token)
      const item = await addGalleryImage(
        id,
        { mediaId: media.id, position: items.length },
        token,
      )
      setItems((prev) => [...prev, item])
      onFeaturedChange(item.media.url)
      toast.success('Portada actualizada')
    } catch (err) {
      toast.error(`Error al subir: ${(err as Error).message}`)
    } finally {
      setUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const makeCover = (item: GalleryItem) => {
    onFeaturedChange(item.media.url)
    toast.success('Nueva portada definida')
  }

  const clearCover = () => onFeaturedChange('')

  const handleDelete = async (item: GalleryItem) => {
    if (!articleId) return
    if (!confirm('¿Eliminar esta foto?')) return
    setBusyId(item.mediaId)
    try {
      await removeGalleryImage(articleId, item.mediaId, token)
      const updated = items.filter((i) => i.mediaId !== item.mediaId)
      setItems(updated)
      if (baseImageUrl(item.media.url) === coverBase) onFeaturedChange('')
      toast.success('Foto eliminada')
    } catch (err) {
      toast.error(`Error al eliminar: ${(err as Error).message}`)
    } finally {
      setBusyId(null)
    }
  }

  /** Mueve una foto de la galería (no-portada) una posición a izquierda/derecha. */
  const move = async (mediaId: string, direction: 'left' | 'right') => {
    const ordered = [...galleryItems]
    const index = ordered.findIndex((i) => i.mediaId === mediaId)
    const swap = direction === 'left' ? index - 1 : index + 1
    if (swap < 0 || swap >= ordered.length) return
    ;[ordered[index], ordered[swap]] = [ordered[swap], ordered[index]]

    // Reconstruir items: portada (si está en items) primero, luego la galería reordenada
    const next = coverItem ? [coverItem, ...ordered] : ordered
    const repositioned = next.map((i, idx) => ({ ...i, position: idx }))
    setItems(repositioned)
    try {
      await reorderGallery(
        articleId!,
        repositioned.map((i) => ({ mediaId: i.mediaId, position: i.position })),
        token,
      )
    } catch {
      toast.error('Error al guardar el orden')
    }
  }

  const handleCaptionBlur = async (mediaId: string, caption: string) => {
    if (!articleId) return
    try {
      await updateGalleryCaption(articleId, mediaId, caption, token)
    } catch {
      toast.error('Error al guardar el pie de foto')
    }
  }

  const captionClass =
    'w-full mt-1 px-2 py-1 text-[11px] border border-[var(--color-border)] rounded bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-primary/30 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]'
  const overlayBtn =
    'p-1.5 rounded-md bg-white/90 hover:bg-white text-[var(--color-text-primary)] shadow-sm transition-colors disabled:opacity-50'
  const coverActionBtn =
    'flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:border-primary hover:text-primary transition-colors disabled:opacity-50'

  return (
    <div className="space-y-3">
      {/* Zona de subida múltiple */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && dropInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          uploading
            ? 'border-primary/40 bg-primary/5 cursor-wait'
            : 'border-[var(--color-border)] hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
        }`}
      >
        <input
          ref={dropInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => onDropFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-primary text-xs">
            <Loader2 size={16} className="animate-spin" /> Subiendo y optimizando...
          </div>
        ) : (
          <div className="space-y-1">
            <Upload size={18} className="mx-auto text-[var(--color-text-muted)]" />
            <p className="text-xs text-[var(--color-text-secondary)]">
              Suelta varias fotos o haz clic para seleccionar
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              La primera será la portada · JPG, PNG, WebP, HEIC
            </p>
          </div>
        )}
      </div>

      {/* Portada + galería */}
      {(featuredImage || galleryItems.length > 0) && (
        <div className="space-y-3">
          {/* Tapa — a todo el ancho, en 16:9 (mismo aspecto que el recuadre) */}
          {featuredImage && (
            <div className="space-y-2">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[var(--color-surface-2)] ring-2 ring-primary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cldUrl(featuredImage, { w: 640, h: 360 }) || featuredImage}
                  alt="Portada"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-semibold">
                  <Star size={10} className="fill-white" /> Portada
                </span>
              </div>
              {/* Acciones de la portada — siempre visibles (también en táctil) */}
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setCropping(true)} className={coverActionBtn} title="Recuadrar la portada manualmente">
                  <Crop size={13} /> Recuadrar
                </button>
                <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploading} className={coverActionBtn} title="Cambiar la imagen de portada">
                  <RefreshCw size={13} /> Cambiar
                </button>
                <button type="button" onClick={clearCover} className={`${coverActionBtn} ml-auto !text-red-600`} title="Quitar portada">
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => handleReplaceCover(e.target.files?.[0])}
              />
            </div>
          )}

          {/* Galería (sin la portada) */}
          {galleryItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
          {galleryItems.map((item, index) => (
            <div key={item.mediaId}>
              <div className="group relative aspect-square rounded-lg overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                <Image
                  src={cldUrl(item.media.url, { w: 320, h: 320 })}
                  alt={item.caption || `Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                {/* Acciones */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => makeCover(item)} className={overlayBtn} title="Hacer portada">
                    <Star size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={busyId === item.mediaId}
                    className={`${overlayBtn} text-red-600`}
                    title="Eliminar foto"
                  >
                    {busyId === item.mediaId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
                {/* Reordenar */}
                <div className="absolute bottom-1.5 inset-x-1.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => move(item.mediaId, 'left')} disabled={index === 0} className={overlayBtn} title="Mover antes">
                    <ChevronLeft size={13} />
                  </button>
                  <button type="button" onClick={() => move(item.mediaId, 'right')} disabled={index === galleryItems.length - 1} className={overlayBtn} title="Mover después">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
              <input
                type="text"
                defaultValue={item.caption || ''}
                placeholder="Pie de foto"
                maxLength={200}
                className={captionClass}
                onBlur={(e) => handleCaptionBlur(item.mediaId, e.target.value)}
              />
            </div>
          ))}
          </div>
          )}
        </div>
      )}

      {!articleId && (
        <p className="text-[11px] text-[var(--color-text-muted)] text-center leading-snug">
          Al subir la primera foto se guarda el borrador automáticamente (necesita un título).
        </p>
      )}

      {cropping && featuredImage && (
        <ImageCropModal
          imageUrl={baseImageUrl(featuredImage)}
          aspect={16 / 9}
          title="Recuadrar portada"
          onSave={(crop: CropRegion | null) => {
            onFeaturedChange(setImageCrop(featuredImage, crop))
            setCropping(false)
          }}
          onClose={() => setCropping(false)}
        />
      )}
    </div>
  )
}
