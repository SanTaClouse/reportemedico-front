'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { ArrowLeft, ArrowLeftRight, GitMerge, AlertTriangle, Loader2, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { mergeDoctors, DOCTOR_STATUS_LABELS, type Doctor } from '@/lib/api-guia'

interface Props {
  docA: Doctor
  docB: Doctor
  token: string
}

// Campos escalares fusionables (mismo set que el backend, 07 §2)
const FIELDS = [
  { key: 'title', label: 'Título' },
  { key: 'firstName', label: 'Nombre' },
  { key: 'lastName', label: 'Apellido' },
  { key: 'email', label: 'Email' },
  { key: 'phonePublic', label: 'WhatsApp público' },
  { key: 'phoneInternal', label: 'Teléfono interno' },
  { key: 'phoneOffice', label: 'Teléfono consultorio' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'bio', label: 'Biografía' },
  { key: 'photoUrl', label: 'Foto' },
  { key: 'videoUrl', label: 'Video' },
  { key: 'exequatur', label: 'Exequátur' },
  { key: 'languages', label: 'Idiomas' },
  { key: 'telehealth', label: 'Teleconsulta' },
] as const

type FieldKey = (typeof FIELDS)[number]['key']

const isEmpty = (key: FieldKey, v: unknown): boolean => {
  if (key === 'telehealth') return false // booleano: siempre tiene valor
  if (key === 'languages') return !(Array.isArray(v) && v.length > 0)
  return !v
}

const equalValue = (key: FieldKey, a: unknown, b: unknown): boolean => {
  if (key === 'languages') return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
  return (a ?? '') === (b ?? '')
}

export default function FusionarClient({ docA, docB, token }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  // El destino (keeper) debe tener auth0Sub null (07 §2). Si ambos lo tienen,
  // no se puede fusionar. Si solo uno es elegible, ese es el destino fijo.
  const aEligible = !docA.auth0Sub
  const bEligible = !docB.auth0Sub
  const bothClaimed = !aEligible && !bEligible

  // Destino por defecto: el publicado (más capital SEO), si no, el más antiguo.
  const defaultTargetIsA = useMemo(() => {
    if (aEligible && !bEligible) return true
    if (bEligible && !aEligible) return false
    if (docA.status === 'PUBLISHED' && docB.status !== 'PUBLISHED') return true
    if (docB.status === 'PUBLISHED' && docA.status !== 'PUBLISHED') return false
    return new Date(docA.createdAt) <= new Date(docB.createdAt)
  }, [aEligible, bEligible, docA, docB])

  const [targetIsA, setTargetIsA] = useState(defaultTargetIsA)
  const canSwap = aEligible && bEligible

  const target = targetIsA ? docA : docB
  const source = targetIsA ? docB : docA

  // fromSource: claves cuyo valor gana el duplicado. Default: autocompletar los
  // campos vacíos en el destino con el valor del duplicado.
  const initialFromSource = (t: Doctor, s: Doctor) =>
    new Set<FieldKey>(
      FIELDS.filter(({ key }) => isEmpty(key, t[key]) && !isEmpty(key, s[key])).map((f) => f.key),
    )
  const [fromSource, setFromSource] = useState<Set<FieldKey>>(() => initialFromSource(target, source))

  const swap = () => {
    const nextTargetIsA = !targetIsA
    const nextTarget = nextTargetIsA ? docA : docB
    const nextSource = nextTargetIsA ? docB : docA
    setTargetIsA(nextTargetIsA)
    setFromSource(initialFromSource(nextTarget, nextSource))
  }

  const choose = (key: FieldKey, useSource: boolean) =>
    setFromSource((prev) => {
      const next = new Set(prev)
      if (useSource) next.add(key)
      else next.delete(key)
      return next
    })

  const handleMerge = async () => {
    setBusy(true)
    const toastId = toast.loading('Fusionando perfiles...')
    try {
      const merged = await mergeDoctors(target.id, source.id, [...fromSource], token)
      toast.success('Perfiles fusionados — el duplicado se eliminó', { id: toastId })
      router.push(`/admin/guia-medica/medicos/${merged.id}`)
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
      setBusy(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/guia-medica/medicos"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary mb-3"
      >
        <ArrowLeft size={13} /> Volver a médicos
      </Link>

      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-1">
        <GitMerge size={22} className="text-primary" /> Fusionar perfiles duplicados
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">
        Se conserva un perfil (con su URL e historial) y se elimina el otro. Para cada dato puedes elegir qué versión queda.
      </p>

      {bothClaimed ? (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertTriangle size={18} className="shrink-0 mt-px" />
          <span>
            Los dos perfiles ya fueron reclamados por un médico (ambos tienen cuenta). No se pueden fusionar automáticamente
            para no pisar una cuenta. Desactiva manualmente el que sobre.
          </span>
        </div>
      ) : (
        <>
          {/* Resumen destino / duplicado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <DoctorHeader doctor={target} role="destino" />
            <DoctorHeader doctor={source} role="duplicado" />
          </div>

          {canSwap && (
            <button
              onClick={swap}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mb-5"
            >
              <ArrowLeftRight size={13} /> Intercambiar cuál se conserva
            </button>
          )}
          {!canSwap && (
            <p className="text-[11px] text-[var(--color-text-muted)] mb-5">
              El otro perfil ya tiene cuenta de médico, así que el destino queda fijo (no se puede pisar una cuenta reclamada).
            </p>
          )}

          {/* Comparación campo por campo */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden mb-5">
            <div className="grid grid-cols-[140px_1fr_1fr] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <div className="px-3 py-2">Campo</div>
              <div className="px-3 py-2">Destino (se conserva)</div>
              <div className="px-3 py-2">Duplicado</div>
            </div>
            {FIELDS.map(({ key, label }) => {
              const tVal = target[key]
              const sVal = source[key]
              if (isEmpty(key, tVal) && isEmpty(key, sVal)) return null
              const same = equalValue(key, tVal, sVal)
              const useSource = fromSource.has(key)
              return (
                <div
                  key={key}
                  className="grid grid-cols-[140px_1fr_1fr] border-b border-[var(--color-border)] last:border-0 text-sm"
                >
                  <div className="px-3 py-2.5 text-xs font-medium text-[var(--color-text-secondary)]">{label}</div>
                  {same ? (
                    <div className="px-3 py-2.5 col-span-2 text-[var(--color-text-secondary)]">
                      <FieldValue field={key} value={tVal} /> <span className="text-[11px] text-[var(--color-text-muted)]">(iguales)</span>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => choose(key, false)}
                        className={`text-left px-3 py-2.5 border-l-2 transition-colors ${
                          !useSource
                            ? 'border-primary bg-primary-pale/60'
                            : 'border-transparent hover:bg-[var(--color-surface-2)]'
                        }`}
                      >
                        <FieldValue field={key} value={tVal} />
                      </button>
                      <button
                        onClick={() => choose(key, true)}
                        className={`text-left px-3 py-2.5 border-l-2 transition-colors ${
                          useSource
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-transparent hover:bg-[var(--color-surface-2)]'
                        }`}
                      >
                        <FieldValue field={key} value={sVal} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Qué se combina automáticamente */}
          <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] rounded-lg px-3 py-2.5 mb-5 space-y-1">
            <p className="font-medium text-[var(--color-text-secondary)]">Además, automáticamente:</p>
            <p>· Especialidades, clínicas y seguros se <strong>combinan</strong> (la unión de ambos).</p>
            <p>· Artículos, clics de WhatsApp, sesiones, emails y beneficios pasan al perfil que se conserva.</p>
            {source.auth0Sub && <p>· La cuenta de acceso del médico (login) queda ligada al perfil conservado.</p>}
            <p>· Se mantiene la URL <strong>/medico/{target.slug}</strong> (capital SEO).</p>
          </div>

          {/* Confirmación */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleMerge}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <GitMerge size={16} />}
              Fusionar y eliminar el duplicado
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle size={13} /> Esta acción no se puede deshacer.
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function DoctorHeader({ doctor, role }: { doctor: Doctor; role: 'destino' | 'duplicado' }) {
  const isTarget = role === 'destino'
  return (
    <div
      className={`rounded-xl border p-3 ${
        isTarget ? 'border-primary/40 bg-primary-pale/40' : 'border-amber-300 bg-amber-50/60'
      }`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${isTarget ? 'text-primary' : 'text-amber-700'}`}>
        {isTarget ? 'Se conserva' : 'Se elimina'}
      </p>
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 relative">
          {doctor.photoUrl ? (
            <NextImage src={doctor.photoUrl} alt="" fill className="object-cover" sizes="40px" unoptimized={doctor.photoUrl.includes('googleusercontent')} />
          ) : (
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {doctor.firstName[0]}{doctor.lastName[0]}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1 truncate">
            {doctor.title} {doctor.firstName} {doctor.lastName}
            {doctor.isVerified && <BadgeCheck size={14} className="text-primary shrink-0" />}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">
            {DOCTOR_STATUS_LABELS[doctor.status]} · /medico/{doctor.slug}
            {doctor.auth0Sub && ' · con cuenta'}
          </p>
        </div>
      </div>
    </div>
  )
}

function FieldValue({ field, value }: { field: FieldKey; value: unknown }) {
  if (field === 'telehealth') {
    return <span>{value ? 'Ofrece teleconsulta' : 'No'}</span>
  }
  if (field === 'languages') {
    const arr = (value as string[]) ?? []
    return <span>{arr.length ? arr.join(', ') : <em className="text-[var(--color-text-muted)]">—</em>}</span>
  }
  if (field === 'photoUrl' || field === 'videoUrl') {
    if (!value) return <em className="text-[var(--color-text-muted)]">—</em>
    if (field === 'photoUrl') {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="w-8 h-8 rounded overflow-hidden relative inline-block bg-[var(--color-surface-2)] align-middle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value as string} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">foto</span>
        </span>
      )
    }
    return <span className="text-[11px] text-[var(--color-text-muted)] break-all">{value as string}</span>
  }
  if (!value) return <em className="text-[var(--color-text-muted)]">—</em>
  const text = String(value)
  return <span className="break-words">{text.length > 160 ? text.slice(0, 160) + '…' : text}</span>
}
