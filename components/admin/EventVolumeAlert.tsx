import { AlertTriangle, ExternalLink } from 'lucide-react'

/** Tope diario del plan gratuito de Brevo */
const FREE_TIER_DAILY = 300

interface Props {
  daysLeft: number
  /** Aprobados: es a quienes les llega cada recordatorio con el QR */
  approved: number
  reminderDays: number[]
  eventDate: string
}

/**
 * Aviso operativo en el panel del evento (pedido de Santiago, 2026-09-23).
 *
 * El riesgo real no es técnico: es llegar al envío masivo de recordatorios con
 * el plan gratuito de Brevo, que corta a los 300 correos diarios y deja a la
 * gente sin su QR. Aparece cuando el evento se acerca y el volumen lo supera.
 */
export default function EventVolumeAlert({ daysLeft, approved, reminderDays, eventDate }: Props) {
  if (daysLeft < 0 || daysLeft > 45) return null
  const proximo = reminderDays.filter((d) => d <= daysLeft).sort((a, b) => b - a)[0]
  const superaTope = approved > FREE_TIER_DAILY

  return (
    <div
      className={`mt-4 rounded-xl border p-4 ${
        superaTope
          ? 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
      }`}
    >
      <p className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <AlertTriangle size={16} strokeWidth={1.5} className={superaTope ? 'text-amber-600' : 'text-[var(--color-text-muted)]'} />
        {daysLeft === 0 ? 'El evento es hoy' : `Faltan ${daysLeft} días para el evento`} · {eventDate}
      </p>
      <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
        {approved === 0
          ? 'Todavía no hay inscripciones aprobadas.'
          : `Cada recordatorio le llega a los ${approved} aprobados, así que son ${approved} correos en un mismo día.`}
        {proximo !== undefined && ` El próximo sale a ${proximo} ${proximo === 1 ? 'día' : 'días'} del evento.`}
        {superaTope && (
          <>
            {' '}
            <strong>
              Eso supera los {FREE_TIER_DAILY} correos diarios del plan gratuito de Brevo: los que sobran no se envían.
            </strong>{' '}
            Confirma que el plan pago esté activo antes de esa fecha.
          </>
        )}
      </p>
      <a
        href="https://app.brevo.com/billing/plan"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Ver el plan en Brevo <ExternalLink size={13} strokeWidth={1.5} />
      </a>
    </div>
  )
}
