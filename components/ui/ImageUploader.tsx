'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImagenNoticia, uploadImagenArticulo } from '@/lib/api'
import { isHeic, prepareImageForUpload } from '@/lib/image-process'
import { cldUrl } from '@/lib/cloudinary'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  /** Si se pasa token → upload admin (Noticias). Sin token → upload público (Articulos). */
  token?: string
  label?: string
  aspectRatio?: 'video' | 'square'
}

export default function ImageUploader({
  value,
  onChange,
  token,
  label = 'Imagen principal',
  aspectRatio = 'video',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [error, setError] = useState('')

  const aspectClass = aspectRatio === 'video' ? 'aspect-video' : 'aspect-square'
  // Preview con el MISMO encuadre (recorte + foco en la cara) que verá el público
  const previewDims = aspectRatio === 'video' ? { w: 640, h: 360 } : { w: 480, h: 480 }

  const handleFile = async (file: File) => {
    const isImage = file.type.startsWith('image/') || isHeic(file)
    if (!isImage) {
      setError('Solo se permiten archivos de imagen.')
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      setError('La imagen no puede superar los 30 MB.')
      return
    }

    setError('')
    setUploading(true)

    try {
      // 1) Convertir HEIC → JPEG y comprimir si hace falta
      const toUpload = await prepareImageForUpload(file, setUploadProgress)

      // 2) Subir
      setUploadProgress('Subiendo a Cloudinary...')
      const result = token
        ? await uploadImagenNoticia(toUpload, token)
        : await uploadImagenArticulo(toUpload)
      onChange(result.url)
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen.')
    } finally {
      setUploading(false)
      setUploadProgress('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
          {label}
        </p>
      )}

      {value ? (
        <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-[var(--color-surface-2)]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cldUrl(value, previewDims) || value} alt="Preview" className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
            <label className="cursor-pointer bg-white/90 text-gray-800 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors flex items-center gap-1.5">
              <Upload size={13} />
              Cambiar
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-white/90 text-red-600 rounded-lg p-1.5 hover:bg-white transition-colors"
              title="Quitar imagen"
            >
              <X size={14} />
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="text-white animate-spin" />
              {uploadProgress && (
                <span className="text-white text-xs font-medium">{uploadProgress}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <label
          className={`relative flex flex-col items-center justify-center w-full ${aspectClass} border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)] transition-colors`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 size={28} strokeWidth={1.5} className="text-[var(--color-primary)] animate-spin mb-2" />
          ) : (
            <Upload size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)] mb-2" />
          )}
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {uploading ? (uploadProgress || 'Procesando...') : 'Haz clic o arrastra una imagen'}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
            JPG, PNG, WebP, HEIC · se optimizan automáticamente
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </label>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
