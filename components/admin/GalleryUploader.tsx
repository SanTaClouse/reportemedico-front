'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Trash2, GripVertical, Upload, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  uploadFotoGaleria,
  addGalleryImage,
  removeGalleryImage,
  reorderGallery,
  updateGalleryCaption,
  type GalleryItem,
} from '@/lib/api'
import { cldUrl } from '@/lib/cloudinary'

interface GalleryUploaderProps {
  articleId: string
  token: string
  initialItems?: GalleryItem[]
}

export default function GalleryUploader({ articleId, token, initialItems = [] }: GalleryUploaderProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setUploading(true)

      const toUpload = Array.from(files)
      let successCount = 0

      for (const file of toUpload) {
        try {
          // 1. Sube a Cloudinary y guarda en Media table
          const media = await uploadFotoGaleria(file, file.name.replace(/\.[^/.]+$/, ''), token)

          // 2. Asocia la media al artículo con posición al final
          const item = await addGalleryImage(
            articleId,
            { mediaId: media.id, position: items.length + successCount },
            token,
          )

          setItems((prev) => [...prev, item])
          successCount++
        } catch (err: any) {
          toast.error(`Error al subir ${file.name}: ${err.message}`)
        }
      }

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? 'Foto agregada a la galería'
            : `${successCount} fotos agregadas a la galería`,
        )
      }

      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [articleId, token, items.length],
  )

  const handleDelete = async (mediaId: string) => {
    if (!confirm('¿Eliminar esta foto de la galería?')) return
    setDeletingId(mediaId)
    try {
      await removeGalleryImage(articleId, mediaId, token)
      const updated = items
        .filter((i) => i.mediaId !== mediaId)
        .map((i, idx) => ({ ...i, position: idx }))
      setItems(updated)
      // Reordenar en el backend para mantener posiciones limpias
      if (updated.length > 0) {
        await reorderGallery(
          articleId,
          updated.map((i) => ({ mediaId: i.mediaId, position: i.position })),
          token,
        )
      }
      toast.success('Foto eliminada')
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const move = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= items.length) return

    const updated = [...items]
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    const reordered = updated.map((item, idx) => ({ ...item, position: idx }))
    setItems(reordered)

    try {
      await reorderGallery(
        articleId,
        reordered.map((i) => ({ mediaId: i.mediaId, position: i.position })),
        token,
      )
    } catch {
      toast.error('Error al guardar el nuevo orden')
    }
  }

  const handleCaptionBlur = async (mediaId: string, caption: string) => {
    try {
      await updateGalleryCaption(articleId, mediaId, caption, token)
    } catch {
      toast.error('Error al guardar el pie de foto')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const inputClass =
    'w-full px-2 py-1 text-xs border border-[var(--color-border)] rounded bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-primary/30 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]'

  return (
    <div className="space-y-3">
      {/* Zona de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-primary/40 bg-primary/5 cursor-wait'
            : 'border-[var(--color-border)] hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-primary text-xs">
            <Loader2 size={16} className="animate-spin" />
            Subiendo...
          </div>
        ) : (
          <div className="space-y-1">
            <Upload size={18} className="mx-auto text-[var(--color-text-muted)]" />
            <p className="text-xs text-[var(--color-text-muted)]">
              Arrastrá fotos acá o hacé clic para seleccionar
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              JPG, PNG, WebP · máx 15 MB por foto
            </p>
          </div>
        )}
      </div>

      {/* Lista de fotos */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.mediaId}
              className="flex gap-2 items-start bg-[var(--color-surface-2)] rounded-lg p-2 border border-[var(--color-border)]"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-12 shrink-0 rounded overflow-hidden bg-[var(--color-border)]">
                <Image
                  src={cldUrl(item.media.url, { w: 128, h: 96 })}
                  alt={item.caption || `Foto ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Caption */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  defaultValue={item.caption || ''}
                  placeholder="Pie de foto (opcional)"
                  maxLength={200}
                  className={inputClass}
                  onBlur={(e) => handleCaptionBlur(item.mediaId, e.target.value)}
                />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  Foto {index + 1} de {items.length}
                </p>
              </div>

              {/* Controles */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover arriba"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Mover abajo"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.mediaId)}
                  disabled={deletingId === item.mediaId}
                  className="p-0.5 rounded text-[var(--color-text-muted)] hover:text-red-500 disabled:opacity-30"
                  title="Eliminar foto"
                >
                  {deletingId === item.mediaId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !uploading && (
        <p className="text-[11px] text-[var(--color-text-muted)] text-center">
          La galería aparece al final de la noticia
        </p>
      )}
    </div>
  )
}
