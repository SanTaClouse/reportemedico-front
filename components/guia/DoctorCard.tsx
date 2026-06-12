import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin, Monitor } from 'lucide-react'
import { cldUrl } from '@/lib/cloudinary'
import WhatsAppButton from './WhatsAppButton'
import type { PublicDoctorCard } from '@/lib/api-guia'

interface Props {
  doctor: PublicDoctorCard
  source: 'search-card' | 'clinic-page'
  highlightInsurance?: string // slug del seguro filtrado → chip resaltado
  distanceKm?: number | null  // "a X km" con geolocalización activa (05 §4)
}

/** Card de médico para listados (programáticas, clínica, búsqueda) — 05 §6 */
export default function DoctorCard({ doctor, source, highlightInsurance, distanceKm }: Props) {
  const fullName = `${doctor.title ?? ''} ${doctor.firstName} ${doctor.lastName}`.trim()
  const mainClinic = doctor.clinics[0]

  return (
    <article className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex gap-4 hover:shadow-md transition-shadow">
      <Link href={`/medico/${doctor.slug}`} className="shrink-0" aria-label={`Ver perfil de ${fullName}`}>
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--color-primary,#001450)] flex items-center justify-center relative">
          {doctor.photoUrl ? (
            <Image
              src={cldUrl(doctor.photoUrl, { w: 160, h: 160 })}
              alt={`${fullName}, ${doctor.specialties[0]?.name ?? 'médico'}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <span className="font-display text-xl font-bold text-white">
              {doctor.firstName[0]}{doctor.lastName[0]}
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/medico/${doctor.slug}`}>
          <h3 className="font-display font-bold text-base text-[var(--color-text-primary)] flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors">
            {fullName}
            {doctor.isVerified && (
              <BadgeCheck size={16} className="text-[var(--color-primary)] shrink-0" aria-label="Exequátur verificado" />
            )}
          </h3>
        </Link>

        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {doctor.specialties.slice(0, 2).map((s) => s.name).join(' · ')}
          {doctor.specialties.length > 2 && ` +${doctor.specialties.length - 2}`}
          {doctor.telehealth && (
            <span className="inline-flex items-center gap-1 ml-2 text-[var(--color-primary)]">
              <Monitor size={11} /> Teleconsulta
            </span>
          )}
        </p>

        {mainClinic && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
            <MapPin size={11} className="shrink-0" />
            {mainClinic.name}, {mainClinic.city.name}
            {doctor.clinics.length > 1 && ` +${doctor.clinics.length - 1}`}
            {typeof distanceKm === 'number' && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--color-primary-pale,#e8edf8)] text-[var(--color-primary)] font-semibold">
                a {distanceKm} km
              </span>
            )}
          </p>
        )}

        {doctor.insurances.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {doctor.insurances.slice(0, 4).map((ins) => (
              <span
                key={ins.slug}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  ins.slug === highlightInsurance
                    ? 'bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)]'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'
                }`}
              >
                {ins.name}
              </span>
            ))}
            {doctor.insurances.length > 4 && (
              <span className="text-[10px] text-[var(--color-text-muted)]">+{doctor.insurances.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {doctor.phonePublic && (
        <div className="shrink-0 self-center">
          <WhatsAppButton
            doctorId={doctor.id}
            phone={doctor.phonePublic}
            doctorLabel={`${doctor.title ?? ''} ${doctor.lastName}`.trim()}
            source={source}
            variant="compact"
          />
        </div>
      )}
    </article>
  )
}
