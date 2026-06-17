/**
 * Helper para inyectar transformaciones de Cloudinary en URLs ya subidas.
 *
 * Cloudinary aplica las transformaciones on-the-fly al servir la imagen y
 * cachea cada variante en su CDN, así que funciona también para imágenes
 * que ya están en la cuenta sin necesidad de re-subirlas.
 *
 * Gravity por defecto: `auto:faces` — detecta caras y las usa como punto
 * focal del recorte. Si no encuentra caras, cae a `auto` (saliency detection)
 * que centra en el sujeto principal de la foto.
 *
 * RECUADRE MANUAL (opcional): si el usuario recuadró la foto, la región
 * elegida viaja en el fragmento de la URL como `#crop=x,y,w,h` (píxeles del
 * original). El fragmento NO se envía al servidor (el browser lo descarta),
 * así que la URL base sigue siendo válida; acá lo leemos y emitimos un
 * `c_crop` (extrae la región) encadenado con `c_fill` (ajusta al tamaño
 * destino sin deformar). Si no hay `#crop`, se usa el encuadre automático.
 *
 * Uso:
 *   <Image src={cldUrl(article.featuredImage, { w: 600, h: 338 })} ... />
 */

type Gravity = 'auto' | 'auto:faces' | 'face' | 'faces' | 'center'

interface CldOptions {
  w: number
  h: number
  /** Gravity de Cloudinary. Default: 'auto:faces' */
  g?: Gravity
}

export interface CropRegion {
  /** Coordenadas en píxeles del ORIGINAL */
  x: number
  y: number
  w: number
  h: number
}

/** Devuelve la URL sin el fragmento de recuadre (`#crop=...`) */
export function baseImageUrl(src: string | null | undefined): string {
  if (!src) return ''
  return src.split('#')[0]
}

/** Lee la región de recuadre manual guardada en el fragmento, o null si no hay */
export function getImageCrop(src: string | null | undefined): CropRegion | null {
  if (!src) return null
  const hash = src.split('#')[1]
  if (!hash) return null
  const m = /(?:^|&)crop=(\d+),(\d+),(\d+),(\d+)(?:&|$)/.exec(hash)
  if (!m) return null
  const [x, y, w, h] = m.slice(1, 5).map(Number)
  if (w <= 0 || h <= 0) return null
  return { x, y, w, h }
}

/** Devuelve la URL con (o sin, si crop=null) el recuadre manual codificado */
export function setImageCrop(src: string, crop: CropRegion | null): string {
  const base = baseImageUrl(src)
  if (!crop) return base
  const x = Math.round(crop.x), y = Math.round(crop.y)
  const w = Math.round(crop.w), h = Math.round(crop.h)
  return `${base}#crop=${x},${y},${w},${h}`
}

export function cldUrl(src: string | null | undefined, { w, h, g = 'auto:faces' }: CldOptions): string {
  if (!src) return ''
  const base = baseImageUrl(src)
  // Solo transformar URLs de Cloudinary; el resto pasa intacto (sin fragmento)
  if (!base.includes('res.cloudinary.com') || !base.includes('/upload/')) return base

  // Si la URL ya contiene transformaciones nuestras, no las dupliques
  // (regla: cualquier segmento /upload/<algo con c_ o w_ o g_>/)
  const transformPattern = /\/upload\/(?:[^/]*[cwhgq]_[^/]*\/)+/
  if (transformPattern.test(base)) return base

  const crop = getImageCrop(src)
  if (crop) {
    // 1) extrae la región elegida  2) la ajusta al tamaño destino sin deformar
    const region = `c_crop,x_${crop.x},y_${crop.y},w_${crop.w},h_${crop.h}`
    const fill = `c_fill,w_${w},h_${h},q_auto,f_auto`
    return base.replace('/upload/', `/upload/${region}/${fill}/`)
  }

  const transform = `c_fill,g_${g},w_${w},h_${h},q_auto,f_auto`
  return base.replace('/upload/', `/upload/${transform}/`)
}
