'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImagenNoticia, uploadImagenArticulo } from '@/lib/api'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  /** Si se pasa token → upload admin (Noticias). Sin token → upload público (Articulos). */
  token?: string
  label?: string
  aspectRatio?: 'video' | 'square'
}

const HEIC_TYPES = ['image/heic', 'image/heif']

/** Detecta HEIC/HEIF también por extensión (iPhone suele enviar type vacío) */
function isHeic(file: File) {
  if (HEIC_TYPES.includes(file.type.toLowerCase())) return true
  return /\.(heic|heif)$/i.test(file.name)
}

/** Convierte HEIC/HEIF → JPEG usando heic2any (carga diferida para no aumentar bundle inicial) */
async function convertHeic(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 }) as Blob
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
}

/** Comprime la imagen en el browser usando Canvas antes de subir */
async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          if (blob.size >= file.size) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
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
      let toUpload = file

      // 1) Convertir HEIC/HEIF → JPEG
      if (isHeic(file)) {
        setUploadProgress('Convirtiendo HEIC a JPEG...')
        toUpload = await convertHeic(file)
      }

      // 2) Comprimir si supera 1 MB
      if (toUpload.size > 1 * 1024 * 1024) {
        setUploadProgress('Optimizando imagen...')
        toUpload = await compressImage(toUpload)
      }

      // 3) Subir
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
          <img src={value} alt="Preview" className="w-full h-full object-cover" />

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
