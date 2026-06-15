/**
 * Helpers de procesamiento de imágenes en el browser, compartidos por los
 * uploaders del admin (portada, galería) y del flujo público.
 *
 * - Convierte HEIC/HEIF (iPhone) → JPEG con carga diferida de heic2any.
 * - Comprime con Canvas antes de subir para no mandar archivos enormes.
 */

const HEIC_TYPES = ['image/heic', 'image/heif']

/** Detecta HEIC/HEIF también por extensión (iPhone suele enviar type vacío) */
export function isHeic(file: File): boolean {
  if (HEIC_TYPES.includes(file.type.toLowerCase())) return true
  return /\.(heic|heif)$/i.test(file.name)
}

/** Convierte HEIC/HEIF → JPEG usando heic2any (import diferido para no inflar el bundle) */
export async function convertHeic(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })) as Blob
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
}

/** Comprime la imagen en el browser usando Canvas antes de subir */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<File> {
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

/**
 * Pipeline completo para una imagen antes de subir:
 * 1) HEIC/HEIF → JPEG  2) comprime si pesa más de `compressThresholdMB` MB.
 * `onProgress` permite mostrar el paso actual en la UI.
 */
export async function prepareImageForUpload(
  file: File,
  onProgress?: (step: string) => void,
  compressThresholdMB = 1,
): Promise<File> {
  let out = file
  if (isHeic(file)) {
    onProgress?.('Convirtiendo HEIC a JPEG...')
    out = await convertHeic(file)
  }
  if (out.size > compressThresholdMB * 1024 * 1024) {
    onProgress?.('Optimizando imagen...')
    out = await compressImage(out)
  }
  return out
}
