'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { X, Check, RotateCcw, ZoomIn } from 'lucide-react'
import type { CropRegion } from '@/lib/cloudinary'

interface ImageCropModalProps {
  /** URL base (original, sin recuadre ni transformaciones) */
  imageUrl: string
  /** Relación de aspecto del marco de recuadre (1 = cuadrado, 16/9, etc.) */
  aspect: number
  title?: string
  /** Guarda la región elegida (en píxeles del original) o null para volver al automático */
  onSave: (crop: CropRegion | null) => void
  onClose: () => void
}

/**
 * Modal de recuadre manual. El usuario mueve y hace zoom; al guardar se
 * devuelve la región en píxeles del original (croppedAreaPixels) que luego
 * se codifica en la URL. "Usar automático" descarta el recuadre.
 */
export default function ImageCropModal({ imageUrl, aspect, title = 'Recuadrar foto', onSave, onClose }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_area: Area, areaPx: Area) => {
    setAreaPixels(areaPx)
  }, [])

  const handleSave = () => {
    if (!areaPixels) { onClose(); return }
    onSave({
      x: Math.max(0, Math.round(areaPixels.x)),
      y: Math.max(0, Math.round(areaPixels.y)),
      w: Math.round(areaPixels.width),
      h: Math.round(areaPixels.height),
    })
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Área de recuadre */}
        <div className="relative w-full bg-black" style={{ height: '60vh', maxHeight: 420 }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border)]">
          <ZoomIn size={16} className="text-[var(--color-text-muted)] shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-[var(--color-primary)]"
            aria-label="Zoom"
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => onSave(null)}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            title="Descartar el recuadre y volver al encuadre automático"
          >
            <RotateCcw size={13} /> Usar automático
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Check size={14} /> Guardar recuadre
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
