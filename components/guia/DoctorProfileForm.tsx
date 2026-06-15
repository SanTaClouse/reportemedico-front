'use client'

import { useState, type ReactNode } from 'react'
import { Plus, X, GripVertical, Monitor } from 'lucide-react'
import type { Doctor, Specialty, Clinic, Insurance } from '@/lib/api-guia'

export interface ProfileFormData {
  title?: string
  firstName: string
  lastName: string
  exequatur?: string
  languages: string[]
  bio?: string
  telehealth: boolean
  specialtyIds: string[]
  clinics: { clinicId: string; schedule?: string }[]
  insuranceIds: string[]
  phonePublic?: string
  phoneOffice?: string
  instagram?: string
}

interface Props {
  initial: Doctor | null
  specialties: Specialty[]
  clinics: Clinic[]
  insurances: Insurance[]
  saving: boolean
  /** Render-prop: recibe una función que devuelve los datos actuales del form */
  renderActions: (getData: () => ProfileFormData) => ReactNode
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#001450)]/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'
const sectionClass = 'bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4'
const COMMON_LANGUAGES = ['Español', 'Inglés', 'Francés', 'Criollo haitiano', 'Italiano', 'Portugués']

export default function DoctorProfileForm({
  initial, specialties, clinics, insurances, saving, renderActions,
}: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? 'Dr.',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    exequatur: initial?.exequatur ?? '',
    bio: initial?.bio ?? '',
    telehealth: initial?.telehealth ?? false,
    phonePublic: initial?.phonePublic ?? '',
    phoneOffice: initial?.phoneOffice ?? '',
    instagram: initial?.instagram ?? '',
  })
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? ['Español'])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    initial?.specialties?.map((s) => s.specialty.id) ?? [],
  )
  const [clinicRows, setClinicRows] = useState<{ clinicId: string; schedule: string }[]>(
    initial?.clinics?.map((c) => ({ clinicId: c.clinic.id, schedule: c.schedule ?? '' })) ?? [],
  )
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>(
    initial?.insurances?.map((i) => i.insurance.id) ?? [],
  )

  const toggleSpecialty = (id: string) =>
    setSelectedSpecialties((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  const toggleInsurance = (id: string) =>
    setSelectedInsurances((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  const toggleLanguage = (lang: string) =>
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]))

  const getData = (): ProfileFormData => ({
    title: form.title || undefined,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    exequatur: form.exequatur.trim() || undefined,
    languages,
    bio: form.bio.trim() || undefined,
    telehealth: form.telehealth,
    specialtyIds: selectedSpecialties,
    clinics: clinicRows.filter((r) => r.clinicId).map((r) => ({ clinicId: r.clinicId, schedule: r.schedule.trim() || undefined })),
    insuranceIds: selectedInsurances,
    phonePublic: form.phonePublic.trim() || undefined,
    phoneOffice: form.phoneOffice.trim() || undefined,
    instagram: form.instagram.trim() || undefined,
  })

  return (
    <div className="space-y-5">
      {/* Datos personales */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Datos personales</h2>
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Título</label>
            <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass}>
              <option value="Dr.">Dr.</option>
              <option value="Dra.">Dra.</option>
              <option value="">—</option>
            </select>
          </div>
          <div className="col-span-4 sm:col-span-2">
            <label className={labelClass}>Nombre *</label>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} autoComplete="given-name" />
          </div>
          <div className="col-span-3">
            <label className={labelClass}>Apellido *</label>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} autoComplete="family-name" />
          </div>
          <div className="col-span-3">
            <label className={labelClass}>Exequátur</label>
            <input value={form.exequatur} onChange={(e) => setForm({ ...form, exequatur: e.target.value })} className={inputClass} placeholder="Tu matrícula" />
          </div>
          <div className="col-span-3 flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input type="checkbox" checked={form.telehealth} onChange={(e) => setForm({ ...form, telehealth: e.target.checked })} className="w-4 h-4 accent-[var(--color-primary,#001450)]" />
              <Monitor size={14} /> Ofrezco teleconsulta
            </label>
          </div>
        </div>

        <div>
          <label className={labelClass}>Idiomas</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  languages.includes(lang)
                    ? 'bg-[var(--color-primary,#001450)] text-white border-[var(--color-primary,#001450)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Sobre ti — el texto que verán los pacientes (formación, experiencia, enfoque)
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
            className={inputClass}
            placeholder="Ej: Cardiólogo en Santo Domingo con 15 años de experiencia. Egresado de la UASD con subespecialidad en ecocardiografía. Atiendo pacientes adultos con énfasis en hipertensión y prevención cardiovascular..."
          />
          <p className={`text-[11px] mt-1 ${form.bio.length >= 300 ? 'text-[var(--color-primary,#001450)]' : 'text-[var(--color-text-muted)]'}`}>
            {form.bio.length} caracteres{form.bio.length > 0 && form.bio.length < 300 ? ' · recomendado: 300+' : ''}
          </p>
        </div>
      </section>

      {/* Especialidades */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Especialidades <span className="font-normal text-xs text-[var(--color-text-muted)]">— la primera es la principal</span>
        </h2>
        {selectedSpecialties.length > 0 && (
          <ol className="flex flex-wrap gap-1.5">
            {selectedSpecialties.map((id, i) => {
              const sp = specialties.find((s) => s.id === id)
              if (!sp) return null
              return (
                <li key={id} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-[var(--color-primary,#001450)] text-white rounded-full text-xs font-medium">
                  <GripVertical size={11} className="opacity-60" />
                  {i + 1}. {sp.name}
                  <button type="button" onClick={() => toggleSpecialty(id)} className="p-0.5 hover:bg-white/20 rounded-full"><X size={11} /></button>
                </li>
              )
            })}
          </ol>
        )}
        <div className="flex flex-wrap gap-1.5">
          {specialties.filter((s) => !selectedSpecialties.includes(s.id)).map((s) => (
            <button key={s.id} type="button" onClick={() => toggleSpecialty(s.id)} className="px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40 hover:text-[var(--color-primary,#001450)] transition-colors">
              + {s.name}
            </button>
          ))}
        </div>
      </section>

      {/* Dónde atiendo */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Dónde atiendo <span className="font-normal text-xs text-[var(--color-text-muted)]">— clínica + horario de consulta</span>
        </h2>
        {clinicRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={row.clinicId}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, clinicId: e.target.value } : r)))}
              className={`${inputClass} max-w-56`}
            >
              <option value="">Elige una clínica...</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id} disabled={clinicRows.some((r, j) => j !== i && r.clinicId === c.id)}>
                  {c.name} ({c.city?.name})
                </option>
              ))}
            </select>
            <input
              value={row.schedule}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, schedule: e.target.value } : r)))}
              className={inputClass}
              placeholder="Lunes a viernes 8:00–12:00"
            />
            <button type="button" onClick={() => setClinicRows((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg">
              <X size={15} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setClinicRows((prev) => [...prev, { clinicId: '', schedule: '' }])} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary,#001450)] hover:underline">
          <Plus size={13} /> Agregar clínica
        </button>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          ¿No encuentras tu clínica en la lista? Escríbela en el horario y nuestro equipo la agrega al aprobar tu perfil.
        </p>
      </section>

      {/* Seguros */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Seguros (ARS) que acepto <span className="font-normal text-xs text-[var(--color-text-muted)]">— lo primero que mira el paciente</span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {insurances.map((ins) => (
            <button
              key={ins.id}
              type="button"
              onClick={() => toggleInsurance(ins.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedInsurances.includes(ins.id)
                  ? 'bg-[var(--color-primary,#001450)] text-white border-[var(--color-primary,#001450)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40'
              }`}
            >
              {ins.name}
            </button>
          ))}
        </div>
      </section>

      {/* Contacto */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Contacto</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>WhatsApp público <span className="text-[var(--color-text-muted)]">(botón de tu perfil)</span></label>
            <input value={form.phonePublic} onChange={(e) => setForm({ ...form, phonePublic: e.target.value })} className={inputClass} placeholder="+1 809..." autoComplete="tel" />
          </div>
          <div>
            <label className={labelClass}>Teléfono del consultorio</label>
            <input value={form.phoneOffice} onChange={(e) => setForm({ ...form, phoneOffice: e.target.value })} className={inputClass} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Instagram</label>
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="@usuario" />
          </div>
        </div>
      </section>

      {renderActions(getData)}
    </div>
  )
}
