/**
 * Borradores de formularios en localStorage. Tolerante a SSR (window ausente)
 * y a JSON corrupto. No es almacenamiento crítico: si falla, se ignora.
 */
export function loadDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* cuota llena o storage deshabilitado: no es crítico */
  }
}

export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}
