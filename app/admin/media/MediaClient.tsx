'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, Upload, Trash2, Copy, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { type Media, deleteMedia, uploadMedia } from '@/lib/api'

interface Props {
  media: Media[]
  token: string
}

export default function MediaClient({ media: initial, token }: Props) {
  const [items, setItems] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [altText, setAltText] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setUploadError('')
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    setUploadError('')
    const toastId = toast.loading('Subiendo imagen a Cloudinary...')
    try {
      const uploaded = await uploadMedia(selectedFile, altText, token)
      setItems((prev) => [uploaded, ...prev])
      setSelectedFile(null)
      setPreview(null)
      setAltText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('Imagen subida correctamente', { id: toastId })
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir la imagen')
      toast.error(err.message || 'Error al subir la imagen', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleCancelUpload = () => {
    setSelectedFile(null)
    setPreview(null)
    setAltText('')
    setUploadError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCopy = (item: Media) => {
    navigator.clipboard.writeText(item.url).then(() => {
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('URL copiada al portapapeles', { duration: 2000 })
    })
  }

  const handleDelete = (item: Media) => {
    toast.warning(`¿Eliminar "${item.altText || 'esta imagen'}"?`, {
      description: 'Se eliminará de Cloudinary y no se puede recuperar.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          setDeletingId(item.id)
          const toastId = toast.loading('Eliminando imagen...')
          try {
            await deleteMedia(item.id, token)
            setItems((prev) => prev.filter((m) => m.id !== item.id))
            toast.success('Imagen eliminada', { id: toastId })
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

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon size={22} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Media</h1>
        <span className="ml-auto text-sm text-[var(--color-text-muted)]">{items.length} archivo{items.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Upload section */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Subir imagen</h2>

        {!selectedFile ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-2)] transition-colors">
            <Upload size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)] mb-2" />
            <span className="text-sm text-[var(--color-text-muted)]">Haz clic para seleccionar una imagen</span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">JPG, PNG, WebP, GIF</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <form onSubmit={handleUpload} className="flex gap-4 items-start">
            {/* Preview */}
            <div className="relative shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-[var(--color-surface-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleCancelUpload}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Texto alternativo (alt)"
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)]"
              />
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                <Upload size={15} />
                {uploading ? 'Subiendo...' : 'Subir a Cloudinary'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Media grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          <ImageIcon size={40} strokeWidth={1} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-1">No hay imágenes en la biblioteca</p>
          <p className="text-sm">Sube tu primera imagen usando el formulario de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden"
            >
              {/* Image */}
              <div className="aspect-square bg-[var(--color-surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.altText || ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleCopy(item)}
                  title="Copiar URL"
                  className="bg-white text-gray-800 rounded-lg p-2 hover:bg-gray-100 transition-colors"
                >
                  {copiedId === item.id ? (
                    <Check size={15} className="text-green-600" />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={deletingId === item.id}
                  title="Eliminar"
                  className="bg-white text-gray-800 rounded-lg p-2 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Alt / dimensions */}
              <div className="px-2 py-1.5 border-t border-[var(--color-border)]">
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {item.altText || 'Sin alt'}
                </p>
                {item.width && item.height && (
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {item.width}×{item.height}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
