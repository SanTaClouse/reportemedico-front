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

export function cldUrl(src: string | null | undefined, { w, h, g = 'auto:faces' }: CldOptions): string {
  if (!src) return ''
  // Solo transformar URLs de Cloudinary; el resto pasa intacto
  if (!src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src

  // Si la URL ya contiene transformaciones nuestras, no las dupliques
  // (regla: cualquier segmento /upload/<algo con c_ o w_ o g_>/)
  const transformPattern = /\/upload\/(?:[^/]*[cwhgq]_[^/]*\/)+/
  if (transformPattern.test(src)) return src

  const transform = `c_fill,g_${g},w_${w},h_${h},q_auto,f_auto`
  return src.replace('/upload/', `/upload/${transform}/`)
}
