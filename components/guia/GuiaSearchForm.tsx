'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, MapPin, Loader2, LocateFixed, User, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { suggestDoctors, type SuggestItem, type Specialty, type City, type Insurance } from '@/lib/api-guia'
import { cldUrl } from '@/lib/cloudinary'

interface Props {
  insurances: Insurance[]
  specialties: Specialty[]
  cities: City[]
  /** Valores actuales (cuando se renderiza sobre la página de resultados) */
  current?: { seguro?: string; especialidad?: string; ciudad?: string; q?: string; modalidad?: string }
  compact?: boolean
}

const selectClass =
  'w-full px-3 py-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30'

/**
 * Buscador de la guía (05 §1): el seguro va PRIMERO y más prominente —
 * es el criterio #1 del paciente dominicano (00 §2).
 */
export default function GuiaSearchForm({ insurances, specialties, cities, current = {}, compact = false }: Props) {
  const router = useRouter()
  const [seguro, setSeguro] = useState(current.seguro ?? '')
  const [especialidad, setEspecialidad] = useState(current.especialidad ?? '')
  const [ciudad, setCiudad] = useState(current.ciudad ?? '')
  const [modalidad, setModalidad] = useState(current.modalidad ?? '')
  const [q, setQ] = useState(current.q ?? '')
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // Typeahead con debounce 300ms (05 §2)
  const handleQChange = (value: string) => {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        setSuggestions(await suggestDoctors(value.trim()))
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  // Cerrar sugerencias al clickear afuera
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggestions([])
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const buildSearch = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    if (seguro) params.set('seguro', seguro)
    if (especialidad) params.set('especialidad', especialidad)
    if (ciudad) params.set('ciudad', ciudad)
    if (modalidad) params.set('modalidad', modalidad)
    if (q.trim()) params.set('q', q.trim())
    for (const [k, v] of Object.entries(extra)) params.set(k, v)
    return params
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = buildSearch()
    if (!params.size) {
      toast.info('Elige al menos un filtro o escribe un nombre')
      return
    }
    router.push(`/guia-medica?${params}`)
  }

  // Geolocalización SOLO al hacer clic — nunca al cargar (05 §4)
  const handleNearMe = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu navegador no soporta geolocalización — elige tu ciudad')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const params = buildSearch({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
        })
        router.push(`/guia-medica?${params}`)
      },
      () => {
        setLocating(false)
        toast.error('Activa la ubicación o elige tu ciudad en el filtro')
      },
      { timeout: 8000 },
    )
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className={`grid gap-2 ${compact ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {/* SEGURO primero — el filtro número uno (P-insight de mercado) */}
        <select value={seguro} onChange={(e) => setSeguro(e.target.value)} className={selectClass} aria-label="Seguro (ARS)">
          <option value="">🛡️ Tu seguro (ARS)</option>
          {insurances.map((i) => <option key={i.id} value={i.slug}>{i.name}</option>)}
        </select>
        <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className={selectClass} aria-label="Especialidad">
          <option value="">Especialidad</option>
          {specialties.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
        <select value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={selectClass} aria-label="Ciudad">
          <option value="">Ciudad</option>
          {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        {compact && (
          <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className={selectClass} aria-label="Modalidad">
            <option value="">Modalidad</option>
            <option value="teleconsulta">💻 Teleconsulta</option>
          </select>
        )}
        {compact && (
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary,#001450)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Search size={15} /> Buscar
          </button>
        )}
      </div>

      <div ref={boxRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={q}
              onChange={(e) => handleQChange(e.target.value)}
              placeholder="Nombre del médico o clínica..."
              className={`${selectClass} pl-9`}
              aria-label="Buscar por nombre de médico o clínica"
            />
            {searching && (
              <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]" />
            )}
          </div>
          {!compact && (
            <>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary,#001450)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Search size={15} /> Buscar
              </button>
              <button
                type="button"
                onClick={handleNearMe}
                disabled={locating}
                className="flex items-center gap-2 px-4 py-2.5 border border-[var(--color-primary,#001450)]/30 text-[var(--color-primary,#001450)] rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-pale,#e8edf8)] transition-colors disabled:opacity-50"
                title="Médicos cerca de mí"
              >
                {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                <span className="hidden sm:inline">Cerca de mí</span>
              </button>
            </>
          )}
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg divide-y divide-[var(--color-border)] overflow-hidden">
            {suggestions.map((s) => (
              <li key={`${s.type}-${s.slug}`}>
                <button
                  type="button"
                  onClick={() => router.push(s.type === 'doctor' ? `/medico/${s.slug}` : `/clinica/${s.slug}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  {s.type === 'doctor' ? (
                    <span className="relative w-9 h-9 rounded-full overflow-hidden bg-[var(--color-primary,#001450)] flex items-center justify-center shrink-0">
                      {s.photoUrl ? (
                        <Image src={cldUrl(s.photoUrl, { w: 72, h: 72 })} alt="" fill className="object-cover" sizes="36px" />
                      ) : (
                        <User size={16} className="text-white" />
                      )}
                    </span>
                  ) : (
                    <span className="w-9 h-9 rounded-lg bg-[var(--color-accent,#F0B414)]/15 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-[var(--color-accent,#F0B414)]" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium text-sm text-[var(--color-text-primary)] truncate">{s.label}</span>
                    {s.sublabel && <span className="block text-xs text-[var(--color-text-muted)] truncate">{s.sublabel}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  )
}
