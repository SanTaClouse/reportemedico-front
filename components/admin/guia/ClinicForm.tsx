'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Check, X, Loader2, MapPin, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClinic, updateClinic, createCity, type City, type Clinic } from '@/lib/api-guia'

// Bounding box de República Dominicana (07 §5) — caza coordenadas invertidas o typos.
export const RD_BOUNDS = { latMin: 17.4, latMax: 20.0, lngMin: -72.1, lngMax: -68.2 }

export const isOutsideRd = (lat: number, lng: number) =>
  lat < RD_BOUNDS.latMin || lat > RD_BOUNDS.latMax || lng < RD_BOUNDS.lngMin || lng > RD_BOUNDS.lngMax

/** Detecta el formato que Google Maps copia con clic derecho: "18.470177, -69.893145" */
export const parseCoordinates = (text: string): { lat: number; lng: number } | null => {
  const match = text.trim().match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'

interface ClinicFormState {
  name: string
  address: string
  cityId: string
  latitude: string
  longitude: string
  phone: string
}

const EMPTY_CLINIC: ClinicFormState = { name: '', address: '', cityId: '', latitude: '', longitude: '', phone: '' }

interface Props {
  token: string
  cities: City[]
  /** Sube al padre la ciudad creada inline para mantener el catálogo en sync. */
  onCityCreated?: (city: City) => void
  initial?: Clinic | null
  onSaved: (clinic: Clinic) => void
  onCancel?: () => void
  submitLabel?: string
}

/**
 * Formulario de clínica reutilizable (catálogos y modal de alta de médico).
 * Las coordenadas son OPCIONALES: si se dejan vacías la clínica queda "sin ubicar"
 * y el panel la flagea para mapearla luego. Permite crear la ciudad inline.
 */
export default function ClinicForm({
  token, cities, onCityCreated, initial, onSaved, onCancel, submitLabel,
}: Props) {
  const [form, setForm] = useState<ClinicFormState>(
    initial
      ? {
          name: initial.name,
          address: initial.address,
          cityId: initial.cityId,
          latitude: initial.latitude != null ? String(initial.latitude) : '',
          longitude: initial.longitude != null ? String(initial.longitude) : '',
          phone: initial.phone ?? '',
        }
      : EMPTY_CLINIC,
  )
  const [busy, setBusy] = useState(false)

  // Validación por campo: aparece tras el primer intento y se corrige en vivo.
  const [submitted, setSubmitted] = useState(false)
  const validate = () => {
    const e: { name?: string; address?: string; cityId?: string } = {}
    if (!form.name.trim()) e.name = 'Ingresa el nombre'
    if (!form.address.trim()) e.address = 'Ingresa la dirección'
    if (!form.cityId) e.cityId = 'Elige una ciudad'
    return e
  }
  const errors: { name?: string; address?: string; cityId?: string } = submitted ? validate() : {}
  const fieldClass = (err?: string) => (err ? `${inputClass} !border-red-400` : inputClass)

  // ─── Crear ciudad inline ───
  const [addingCity, setAddingCity] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [cityBusy, setCityBusy] = useState(false)

  const handleCreateCity = async () => {
    const name = newCity.trim()
    if (!name) return
    setCityBusy(true)
    const toastId = toast.loading('Creando ciudad...')
    try {
      const created = await createCity({ name }, token)
      onCityCreated?.(created)
      setForm((f) => ({ ...f, cityId: created.id }))
      setAddingCity(false)
      setNewCity('')
      toast.success(`Ciudad "${created.name}" creada`, { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setCityBusy(false)
    }
  }

  const lat = parseFloat(form.latitude)
  const lng = parseFloat(form.longitude)
  const hasCoords = !isNaN(lat) && !isNaN(lng)
  const outsideRd = hasCoords && isOutsideRd(lat, lng)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(validate()).length) {
      toast.error('Revisa los campos marcados en rojo')
      return
    }
    setBusy(true)
    const toastId = toast.loading(initial ? 'Guardando clínica...' : 'Creando clínica...')
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      cityId: form.cityId,
      ...(hasCoords ? { latitude: lat, longitude: lng } : {}),
      phone: form.phone.trim() || undefined,
    }
    try {
      const saved = initial
        ? await updateClinic(initial.id, payload, token)
        : await createClinic(payload, token)
      toast.success(`Clínica "${saved.name}" guardada`, { id: toastId })
      if (saved.locationWarning) toast.warning(saved.locationWarning)
      else if (!hasCoords) toast.warning('Clínica creada sin ubicación — recuerda mapearla para que salga en el mapa')
      onSaved(saved)
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Nombre <span className="text-red-600">*</span></label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass(errors.name)} placeholder="Clínica Abreu" />
          {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Ciudad <span className="text-red-600">*</span></label>
          {addingCity ? (
            <div className="flex gap-1.5">
              <input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCity() } }}
                className={inputClass}
                placeholder="Nueva ciudad"
                autoFocus
              />
              <button type="button" onClick={handleCreateCity} disabled={cityBusy || !newCity.trim()} className="p-2 text-primary hover:bg-primary-pale rounded-lg disabled:opacity-50">
                {cityBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button type="button" onClick={() => { setAddingCity(false); setNewCity('') }} className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-lg">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className={fieldClass(errors.cityId)}>
                <option value="">Elegir ciudad...</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setAddingCity(true)}
                title="Crear ciudad nueva"
                className="shrink-0 px-2.5 flex items-center gap-1 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary-pale transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
          {errors.cityId && !addingCity && <p className="text-[11px] text-red-600 mt-1">{errors.cityId}</p>}
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Dirección <span className="text-red-600">*</span></label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fieldClass(errors.address)} placeholder="Calle Arzobispo Portes 853, Ciudad Nueva" />
          {errors.address && <p className="text-[11px] text-red-600 mt-1">{errors.address}</p>}
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass}>Teléfono</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="(809) 000-0000" />
        </div>
      </div>

      <LocationField
        latitude={form.latitude}
        longitude={form.longitude}
        onChange={(la, lo) => setForm((f) => ({ ...f, latitude: la, longitude: lo }))}
      />

      {outsideRd && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertTriangle size={14} />
          Esta ubicación está fuera de República Dominicana — revisa que no estén invertidas las coordenadas.
        </div>
      )}
      {!hasCoords && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Puedes dejarla sin ubicación y mapearla luego — quedará marcada como pendiente en el panel y no aparecerá en el mapa.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {submitLabel ?? (initial ? 'Guardar cambios' : 'Crear clínica')}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-2)] transition-colors">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

/** ClinicForm dentro de un modal (portal). Reusado en el alta de médico y en la
 *  normalización de clínicas sugeridas. */
export function ClinicFormModal({
  open, title = 'Crear clínica nueva', onClose, ...formProps
}: { open: boolean; title?: string; onClose: () => void } & Omit<Props, 'onCancel'>) {
  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-lg">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          <ClinicForm {...formProps} onCancel={onClose} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Campo de ubicación: pegar las coordenadas de Google Maps (07 §5) ──────────
// Decisión del cliente (2026-06-24): la geocodificación por texto es poco
// confiable; lo más práctico y exacto es copiar las coordenadas directo de Maps
// (clic derecho → copiar) y pegarlas acá. Sin búsqueda por nombre.

export function LocationField({
  latitude, longitude, onChange,
}: {
  latitude: string
  longitude: string
  onChange: (lat: string, lng: string) => void
}) {
  const [paste, setPaste] = useState('')

  // Al pegar el par "lat, lng" se fija al instante; el input se limpia.
  const handlePaste = (value: string) => {
    setPaste(value)
    const coords = parseCoordinates(value)
    if (coords) {
      onChange(String(coords.lat), String(coords.lng))
      setPaste('')
      toast.success(`Ubicación fijada: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
    }
  }

  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)
  const hasCoords = !isNaN(lat) && !isNaN(lng)

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
        Ubicación <span className="text-[var(--color-text-muted)]">(opcional)</span>
      </label>
      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
        En Google Maps, haz clic derecho sobre la clínica y elige el primer renglón
        (las coordenadas, ej. <span className="font-mono">18.4702, -69.8931</span>) — se copian solas. Pégalas aquí abajo.
      </p>
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          value={paste}
          onChange={(e) => handlePaste(e.target.value)}
          placeholder="Pega aquí: 18.470177, -69.893145"
          className={`${inputClass} pl-9`}
        />
      </div>

      {hasCoords && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-primary-pale rounded-lg text-xs text-primary">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Check size={13} /> Ubicación fijada: {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
          <button type="button" onClick={() => onChange('', '')} className="text-[var(--color-text-muted)] hover:text-red-600 font-medium">
            Quitar
          </button>
        </div>
      )}

      <details className="text-[11px] text-[var(--color-text-muted)]">
        <summary className="cursor-pointer hover:text-[var(--color-text-secondary)] select-none">Escribir latitud y longitud por separado</summary>
        <div className="flex gap-3 mt-2">
          <div className="flex-1">
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">Latitud</label>
            <input value={latitude} onChange={(e) => onChange(e.target.value, longitude)} className={inputClass} placeholder="18.470177" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">Longitud</label>
            <input value={longitude} onChange={(e) => onChange(latitude, e.target.value)} className={inputClass} placeholder="-69.893145" />
          </div>
        </div>
      </details>
    </div>
  )
}
