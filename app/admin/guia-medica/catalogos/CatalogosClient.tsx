'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, MapPin, Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  createSpecialty, updateSpecialty, deleteSpecialty,
  createCity, updateCity, deleteCity,
  createClinic, updateClinic, deleteClinic,
  createInsurance, updateInsurance, deleteInsurance,
  type Specialty, type City, type Clinic, type Insurance,
} from '@/lib/api-guia'

interface Props {
  initialSpecialties: Specialty[]
  initialCities: City[]
  initialClinics: Clinic[]
  initialInsurances: Insurance[]
  token: string
}

type TabKey = 'especialidades' | 'clinicas' | 'seguros' | 'ciudades'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'especialidades', label: 'Especialidades' },
  { key: 'clinicas', label: 'Clínicas' },
  { key: 'seguros', label: 'Seguros (ARS)' },
  { key: 'ciudades', label: 'Ciudades' },
]

// Valores del enum MedicalSpecialty de schema.org (para JSON-LD)
const SCHEMA_ORG_OPTIONS = [
  'Anesthesia', 'Cardiovascular', 'CommunityHealth', 'Dentistry', 'Dermatology',
  'DietNutrition', 'Emergency', 'Endocrine', 'Gastroenterologic', 'Genetic',
  'Geriatric', 'Gynecologic', 'Hematologic', 'Infectious', 'Midwifery',
  'Musculoskeletal', 'Neurologic', 'Obstetric', 'Oncologic', 'Otolaryngologic',
  'Pediatric', 'PlasticSurgery', 'Podiatric', 'PrimaryCare', 'Psychiatric',
  'PublicHealth', 'Pulmonary', 'Radiography', 'Renal', 'Rheumatologic',
  'Surgical', 'Urologic',
]

// Bounding box de República Dominicana (07 §5)
const RD_BOUNDS = { latMin: 17.4, latMax: 20.0, lngMin: -72.1, lngMax: -68.2 }

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'

const isOutsideRd = (lat: number, lng: number) =>
  lat < RD_BOUNDS.latMin || lat > RD_BOUNDS.latMax || lng < RD_BOUNDS.lngMin || lng > RD_BOUNDS.lngMax

/** Detecta el formato que Google Maps copia con clic derecho: "18.470177, -69.893145" */
const parseCoordinates = (text: string): { lat: number; lng: number } | null => {
  const match = text.trim().match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

export default function CatalogosClient({
  initialSpecialties, initialCities, initialClinics, initialInsurances, token,
}: Props) {
  const [tab, setTab] = useState<TabKey>('especialidades')
  const [specialties, setSpecialties] = useState(initialSpecialties)
  const [cities, setCities] = useState(initialCities)
  const [clinics, setClinics] = useState(initialClinics)
  const [insurances, setInsurances] = useState(initialInsurances)

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-1">
        Catálogos de la Guía Médica
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Los médicos seleccionan de estos catálogos — nunca texto libre. Un catálogo con médicos asociados no se puede eliminar.
      </p>

      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'especialidades' && (
        <SpecialtiesTab items={specialties} setItems={setSpecialties} token={token} />
      )}
      {tab === 'clinicas' && (
        <ClinicsTab items={clinics} setItems={setClinics} cities={cities} token={token} />
      )}
      {tab === 'seguros' && (
        <SimpleTab
          items={insurances}
          setItems={setInsurances}
          token={token}
          entityName="seguro"
          placeholder="Ej: ARS Humano"
          countLabel={(i) => `${(i as Insurance)._count?.doctors ?? 0} médicos`}
          api={{ create: createInsurance, update: updateInsurance, remove: deleteInsurance }}
        />
      )}
      {tab === 'ciudades' && (
        <SimpleTab
          items={cities}
          setItems={setCities}
          token={token}
          entityName="ciudad"
          placeholder="Ej: Santiago de los Caballeros"
          countLabel={(i) => `${(i as City)._count?.clinics ?? 0} clínicas`}
          api={{ create: createCity, update: updateCity, remove: deleteCity }}
        />
      )}
    </div>
  )
}

// ─── Tab genérico: Seguros y Ciudades (solo nombre) ────────────────────────────

interface SimpleItem { id: string; name: string; slug: string }

function SimpleTab<T extends SimpleItem>({
  items, setItems, token, entityName, placeholder, countLabel, api,
}: {
  items: T[]
  setItems: React.Dispatch<React.SetStateAction<T[]>>
  token: string
  entityName: string
  placeholder: string
  countLabel: (item: T) => string
  api: {
    create: (data: { name: string }, token: string) => Promise<unknown>
    update: (id: string, data: { name: string }, token: string) => Promise<unknown>
    remove: (id: string, token: string) => Promise<unknown>
  }
}) {
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    const toastId = toast.loading('Creando...')
    try {
      const created = (await api.create({ name }, token)) as T
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      toast.success(`"${created.name}" agregado`, { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async (id: string) => {
    const name = editValue.trim()
    if (!name) return
    const toastId = toast.loading('Guardando...')
    try {
      const updated = (await api.update(id, { name }, token)) as T
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
      toast.success('Guardado', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    }
  }

  const handleDelete = (item: T) => {
    toast.warning(`¿Eliminar "${item.name}"?`, {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const toastId = toast.loading('Eliminando...')
          try {
            await api.remove(item.id, token)
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            toast.success(`"${item.name}" eliminado`, { id: toastId })
          } catch (err) {
            toast.error((err as Error).message, { id: toastId })
          }
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Agregar {entityName}
        </button>
      </form>

      <ul className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            {editingId === item.id ? (
              <>
                <input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(item.id)}
                  className={inputClass}
                  autoFocus
                />
                <button onClick={() => handleSave(item.id)} className="p-1.5 text-primary hover:bg-primary-pale rounded-lg">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-lg">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{item.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{countLabel(item)}</span>
                <button
                  onClick={() => { setEditingId(item.id); setEditValue(item.name) }}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary-pale rounded-lg"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">Sin registros todavía</li>
        )}
      </ul>
    </div>
  )
}

// ─── Tab Especialidades (nombre + schema.org) ──────────────────────────────────

function SpecialtiesTab({
  items, setItems, token,
}: {
  items: Specialty[]
  setItems: React.Dispatch<React.SetStateAction<Specialty[]>>
  token: string
}) {
  const [newName, setNewName] = useState('')
  const [newSchemaOrg, setNewSchemaOrg] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSchemaOrg, setEditSchemaOrg] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    const toastId = toast.loading('Creando especialidad...')
    try {
      const created = await createSpecialty({ name, schemaOrgValue: newSchemaOrg || undefined }, token)
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewSchemaOrg('')
      toast.success(`"${created.name}" agregada`, { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async (id: string) => {
    const name = editName.trim()
    if (!name) return
    const toastId = toast.loading('Guardando...')
    try {
      const updated = await updateSpecialty(id, { name, schemaOrgValue: editSchemaOrg || undefined }, token)
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
      toast.success('Guardado', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    }
  }

  const handleDelete = (item: Specialty) => {
    toast.warning(`¿Eliminar "${item.name}"?`, {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const toastId = toast.loading('Eliminando...')
          try {
            await deleteSpecialty(item.id, token)
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            toast.success(`"${item.name}" eliminada`, { id: toastId })
          } catch (err) {
            toast.error((err as Error).message, { id: toastId })
          }
        },
      },
    })
  }

  const schemaOrgSelect = (value: string, onChange: (v: string) => void) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} max-w-52`}>
      <option value="">— sin valor schema.org —</option>
      {SCHEMA_ORG_OPTIONS.map((v) => (
        <option key={v} value={v}>{v}</option>
      ))}
    </select>
  )

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej: Cardiología"
          className={inputClass}
        />
        {schemaOrgSelect(newSchemaOrg, setNewSchemaOrg)}
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Agregar
        </button>
      </form>
      <p className="text-xs text-[var(--color-text-muted)] -mt-2">
        El valor schema.org alimenta el JSON-LD de los perfiles (SEO). Si no hay equivalente claro, dejalo vacío.
      </p>

      <ul className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            {editingId === item.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
                {schemaOrgSelect(editSchemaOrg, setEditSchemaOrg)}
                <button onClick={() => handleSave(item.id)} className="p-1.5 text-primary hover:bg-primary-pale rounded-lg">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-lg">
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">{item.name}</span>
                {item.schemaOrgValue && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-pale text-primary font-medium">
                    {item.schemaOrgValue}
                  </span>
                )}
                <span className="text-xs text-[var(--color-text-muted)]">
                  {item._count?.doctors ?? 0} médicos · {item._count?.tags ?? 0} tags
                </span>
                <button
                  onClick={() => {
                    setEditingId(item.id)
                    setEditName(item.name)
                    setEditSchemaOrg(item.schemaOrgValue ?? '')
                  }}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary-pale rounded-lg"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">Sin especialidades todavía</li>
        )}
      </ul>
    </div>
  )
}

// ─── Tab Clínicas (con campo inteligente de ubicación — 07 §5) ─────────────────

interface ClinicFormState {
  name: string
  address: string
  cityId: string
  latitude: string
  longitude: string
  phone: string
}

const EMPTY_CLINIC: ClinicFormState = { name: '', address: '', cityId: '', latitude: '', longitude: '', phone: '' }

function ClinicsTab({
  items, setItems, cities, token,
}: {
  items: Clinic[]
  setItems: React.Dispatch<React.SetStateAction<Clinic[]>>
  cities: City[]
  token: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Clinic | null>(null)
  const [form, setForm] = useState<ClinicFormState>(EMPTY_CLINIC)
  const [busy, setBusy] = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY_CLINIC); setShowForm(true) }
  const openEdit = (clinic: Clinic) => {
    setEditing(clinic)
    setForm({
      name: clinic.name,
      address: clinic.address,
      cityId: clinic.cityId,
      latitude: String(clinic.latitude),
      longitude: String(clinic.longitude),
      phone: clinic.phone ?? '',
    })
    setShowForm(true)
  }

  const lat = parseFloat(form.latitude)
  const lng = parseFloat(form.longitude)
  const hasCoords = !isNaN(lat) && !isNaN(lng)
  const outsideRd = hasCoords && isOutsideRd(lat, lng)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim() || !form.cityId || !hasCoords) {
      toast.error('Completá nombre, dirección, ciudad y ubicación')
      return
    }
    setBusy(true)
    const toastId = toast.loading(editing ? 'Guardando clínica...' : 'Creando clínica...')
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      cityId: form.cityId,
      latitude: lat,
      longitude: lng,
      phone: form.phone.trim() || undefined,
    }
    try {
      const saved = editing
        ? await updateClinic(editing.id, payload, token)
        : await createClinic(payload, token)
      setItems((prev) =>
        (editing ? prev.map((c) => (c.id === editing.id ? { ...c, ...saved } : c)) : [...prev, saved])
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setShowForm(false)
      toast.success(`Clínica "${saved.name}" guardada`, { id: toastId })
      if (saved.locationWarning) toast.warning(saved.locationWarning)
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = (clinic: Clinic) => {
    toast.warning(`¿Eliminar "${clinic.name}"?`, {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const toastId = toast.loading('Eliminando...')
          try {
            await deleteClinic(clinic.id, token)
            setItems((prev) => prev.filter((c) => c.id !== clinic.id))
            toast.success(`"${clinic.name}" eliminada`, { id: toastId })
          } catch (err) {
            toast.error((err as Error).message, { id: toastId })
          }
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nueva clínica
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
              {editing ? `Editar: ${editing.name}` : 'Nueva clínica'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] rounded-lg">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Clínica Abreu" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Ciudad *</label>
              <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className={inputClass}>
                <option value="">Elegir ciudad...</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Dirección *</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="Calle Arzobispo Portes 853, Ciudad Nueva" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Teléfono</label>
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
              Esta ubicación está fuera de República Dominicana — revisá que no estén invertidas las coordenadas.
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {editing ? 'Guardar cambios' : 'Crear clínica'}
          </button>
        </form>
      )}

      <ul className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        {items.map((clinic) => (
          <li key={clinic.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{clinic.name}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {clinic.city?.name} · {clinic.address} · {clinic.latitude.toFixed(4)}, {clinic.longitude.toFixed(4)}
              </p>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">
              {clinic._count?.doctors ?? 0} médicos
            </span>
            <button onClick={() => openEdit(clinic)} className="p-1.5 text-[var(--color-text-muted)] hover:text-primary hover:bg-primary-pale rounded-lg">
              <Pencil size={15} />
            </button>
            <button onClick={() => handleDelete(clinic)} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">Sin clínicas todavía</li>
        )}
      </ul>
    </div>
  )
}

// ─── Campo inteligente de ubicación (doble vía — 07 §5) ────────────────────────
// Vía 1: pegar coordenadas de Google Maps (clic derecho → copiar) → parse al instante
// Vía 2: texto libre → geocodificación con Nominatim (OSM, sin API key)

interface NominatimResult { display_name: string; lat: string; lon: string }

function LocationField({
  latitude, longitude, onChange,
}: {
  latitude: string
  longitude: string
  onChange: (lat: string, lng: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=do&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept-Language': 'es' } },
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
      if (!data.length) toast.info('Sin resultados — probá pegar las coordenadas de Google Maps')
    } catch {
      toast.error('No se pudo buscar la dirección')
    } finally {
      setSearching(false)
    }
  }, [])

  // Vía 1: si lo escrito/pegado ES un par de coordenadas, se aplica directo
  const handleInput = (value: string) => {
    setQuery(value)
    const coords = parseCoordinates(value)
    if (coords) {
      onChange(String(coords.lat), String(coords.lng))
      setResults([])
      toast.success(`Ubicación fijada: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`)
      return
    }
    // Vía 2: si no, geocodificar con debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length >= 4) {
      debounceRef.current = setTimeout(() => search(value.trim()), 600)
    } else {
      setResults([])
    }
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
        Ubicación * — pegá las coordenadas de Google Maps (clic derecho sobre la clínica → copiar) o buscá por nombre/dirección
      </label>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="18.470177, -69.893145  ó  Clínica Abreu Santo Domingo"
          className={`${inputClass} pl-9`}
        />
        {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]" />}
      </div>

      {results.length > 0 && (
        <ul className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] bg-[var(--color-surface)] max-h-44 overflow-auto">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onChange(r.lat, r.lon)
                  setResults([])
                  setQuery(r.display_name.split(',').slice(0, 2).join(','))
                  toast.success('Ubicación seleccionada')
                }}
                className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
              >
                <MapPin size={12} className="inline mr-1.5 text-primary" />
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">Latitud</label>
          <input
            value={latitude}
            onChange={(e) => onChange(e.target.value, longitude)}
            className={inputClass}
            placeholder="18.470177"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">Longitud</label>
          <input
            value={longitude}
            onChange={(e) => onChange(latitude, e.target.value)}
            className={inputClass}
            placeholder="-69.893145"
          />
        </div>
      </div>
    </div>
  )
}
