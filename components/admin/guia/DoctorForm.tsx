'use client'

import { useState, useRef } from 'react'
import NextImage from 'next/image'
import { Loader2, Check, Plus, X, Upload, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  uploadFotoMedico,
  type Doctor, type DoctorInput, type Specialty, type Clinic, type Insurance,
} from '@/lib/api-guia'
import { cldUrl } from '@/lib/cloudinary'

interface Props {
  specialties: Specialty[]
  clinics: Clinic[]
  insurances: Insurance[]
  initial?: Doctor
  submitLabel: string
  busy: boolean
  token: string
  onSubmit: (data: DoctorInput) => void
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
const labelClass = 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1'
const sectionClass = 'bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4'

const COMMON_LANGUAGES = ['Español', 'Inglés', 'Francés', 'Criollo haitiano', 'Italiano', 'Portugués']

export default function DoctorForm({
  specialties, clinics, insurances, initial, submitLabel, busy, token, onSubmit,
}: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? 'Dr.',
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    exequatur: initial?.exequatur ?? '',
    email: initial?.email ?? '',
    phonePublic: initial?.phonePublic ?? '',
    phoneOffice: initial?.phoneOffice ?? '',
    phoneInternal: initial?.phoneInternal ?? '',
    instagram: initial?.instagram ?? '',
    bio: initial?.bio ?? '',
    photoUrl: initial?.photoUrl ?? '',
    videoUrl: initial?.videoUrl ?? '',
    telehealth: initial?.telehealth ?? false,
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
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const toggleInsurance = (id: string) => {
    setSelectedInsurances((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const toastId = toast.loading('Subiendo foto...')
    try {
      const { url } = await uploadFotoMedico(file, token)
      setForm((f) => ({ ...f, photoUrl: url }))
      toast.success('Foto subida', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Nombre y apellido son obligatorios')
      return
    }
    const data: DoctorInput = {
      title: form.title || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      exequatur: form.exequatur.trim() || undefined,
      email: form.email.trim() || undefined,
      phonePublic: form.phonePublic.trim() || undefined,
      phoneOffice: form.phoneOffice.trim() || undefined,
      phoneInternal: form.phoneInternal.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      bio: form.bio.trim() || undefined,
      photoUrl: form.photoUrl || undefined,
      videoUrl: form.videoUrl.trim() || undefined,
      telehealth: form.telehealth,
      languages,
      specialtyIds: selectedSpecialties,
      clinics: clinicRows
        .filter((r) => r.clinicId)
        .map((r) => ({ clinicId: r.clinicId, schedule: r.schedule.trim() || undefined })),
      insuranceIds: selectedInsurances,
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ─── Datos personales ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Datos personales</h2>

        <div className="flex items-start gap-5">
          {/* Foto */}
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center relative">
              {form.photoUrl ? (
                <NextImage src={cldUrl(form.photoUrl, { w: 192, h: 192 })} alt="Foto del médico" fill className="object-cover" sizes="96px" />
              ) : (
                <span className="font-display text-xl text-[var(--color-text-muted)]">
                  {(form.firstName[0] ?? '') + (form.lastName[0] ?? '') || '—'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-2 w-24 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary-pale transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Foto
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
          </div>

          <div className="flex-1 grid grid-cols-6 gap-3">
            <div className="col-span-1">
              <label className={labelClass}>Título</label>
              <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass}>
                <option value="Dr.">Dr.</option>
                <option value="Dra.">Dra.</option>
                <option value="">—</option>
              </select>
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label className={labelClass}>Nombre *</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className={labelClass}>Apellido *</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Exequátur</label>
              <input value={form.exequatur} onChange={(e) => setForm({ ...form, exequatur: e.target.value })} className={inputClass} placeholder="Matrícula RD" />
            </div>
            <div className="col-span-3">
              <label className={labelClass}>Idiomas</label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() =>
                      setLanguages((prev) =>
                        prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
                      )
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      languages.includes(lang)
                        ? 'bg-primary text-white border-primary'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Bio — &ldquo;Sobre el/la doctor(a)&rdquo; · contenido único SEO del perfil (300–600 caracteres recomendado)
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
            className={inputClass}
            placeholder="Ej: Cardióloga en Santo Domingo con 15 años de experiencia. Egresada de la UASD con subespecialidad en ecocardiografía en México. Atiende pacientes adultos con énfasis en hipertensión y prevención cardiovascular..."
          />
          <p className={`text-[11px] mt-1 ${form.bio.length >= 300 ? 'text-primary' : 'text-[var(--color-text-muted)]'}`}>
            {form.bio.length} caracteres {form.bio.length < 300 && form.bio.length > 0 ? '· mínimo recomendado: 300' : ''}
          </p>
        </div>

        <div>
          <label className={labelClass}>Video de presentación (beneficio premium — URL YouTube o Cloudinary)</label>
          <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputClass} placeholder="https://..." />
        </div>
      </section>

      {/* ─── Contacto ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Contacto</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>WhatsApp público (botón CTA del perfil)</label>
            <input value={form.phonePublic} onChange={(e) => setForm({ ...form, phonePublic: e.target.value })} className={inputClass} placeholder="+1809..." />
          </div>
          <div>
            <label className={labelClass}>Teléfono consultorio</label>
            <input value={form.phoneOffice} onChange={(e) => setForm({ ...form, phoneOffice: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email <span className="text-[var(--color-text-muted)]">(no se muestra públicamente)</span></label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Instagram</label>
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="@usuario" />
          </div>
          <div>
            <label className={labelClass}>Teléfono interno <span className="text-[var(--color-text-muted)]">(solo admin)</span></label>
            <input value={form.phoneInternal} onChange={(e) => setForm({ ...form, phoneInternal: e.target.value })} className={inputClass} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={form.telehealth}
                onChange={(e) => setForm({ ...form, telehealth: e.target.checked })}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
              💻 Ofrece teleconsulta
            </label>
          </div>
        </div>
      </section>

      {/* ─── Especialidades ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Especialidades <span className="font-normal text-xs text-[var(--color-text-muted)]">— la primera es la principal (define el SEO del perfil)</span>
        </h2>
        {selectedSpecialties.length > 0 && (
          <ol className="flex flex-wrap gap-1.5">
            {selectedSpecialties.map((id, i) => {
              const sp = specialties.find((s) => s.id === id)
              if (!sp) return null
              return (
                <li key={id} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-primary text-white rounded-full text-xs font-medium">
                  <GripVertical size={11} className="opacity-60" />
                  {i + 1}. {sp.name}
                  <button type="button" onClick={() => toggleSpecialty(id)} className="p-0.5 hover:bg-white/20 rounded-full">
                    <X size={11} />
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        <div className="flex flex-wrap gap-1.5">
          {specialties
            .filter((s) => !selectedSpecialties.includes(s.id))
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSpecialty(s.id)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40 hover:text-primary transition-colors"
              >
                + {s.name}
              </button>
            ))}
        </div>
      </section>

      {/* ─── Dónde atiende ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Dónde atiende <span className="font-normal text-xs text-[var(--color-text-muted)]">— clínica + tanda de consulta</span>
        </h2>
        {clinicRows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <select
              value={row.clinicId}
              onChange={(e) => setClinicRows((prev) => prev.map((r, j) => (j === i ? { ...r, clinicId: e.target.value } : r)))}
              className={`${inputClass} max-w-64`}
            >
              <option value="">Elegir clínica...</option>
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
              placeholder="Tanda: Lunes a viernes 8:00–12:00"
            />
            <button
              type="button"
              onClick={() => setClinicRows((prev) => prev.filter((_, j) => j !== i))}
              className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setClinicRows((prev) => [...prev, { clinicId: '', schedule: '' }])}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Plus size={13} /> Agregar clínica
        </button>
        {clinicRows.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Sin clínica el médico no aparece en el mapa, en &ldquo;cerca de mí&rdquo; ni en las páginas por ciudad.
          </p>
        )}
      </section>

      {/* ─── Seguros ─── */}
      <section className={sectionClass}>
        <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Seguros (ARS) que acepta <span className="font-normal text-xs text-[var(--color-text-muted)]">— el filtro #1 del paciente</span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {insurances.map((ins) => (
            <button
              key={ins.id}
              type="button"
              onClick={() => toggleInsurance(ins.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedInsurances.includes(ins.id)
                  ? 'bg-primary text-white border-primary'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary/40'
              }`}
            >
              {ins.name}
            </button>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        {submitLabel}
      </button>
    </form>
  )
}
