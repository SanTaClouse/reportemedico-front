import { Crown } from 'lucide-react'
import type { DoctorPlan } from '@/lib/api-guia'

/**
 * MODELO DE DOS SELLOS (confirmado con el cliente, 2026-07-21):
 *
 *   ✓ Exequátur verificado → `isVerified`. GRATIS, lo activa el admin al
 *     comprobar la matrícula. NUNCA se compra (doc 00 §7.2). Lo renderiza
 *     `VerifiedBadge` (solo ícono + tooltip).
 *   ★ Miembro de la Guía   → ESTE componente. Sello COMERCIAL de los planes pagos.
 *
 * ⚠️ Estándar y Premium se ven IGUAL a propósito (pedido del cliente 2026-07-21:
 * "peor que sean las 2 iguales... o hacerlo muy breve"). El corte visual que
 * importa es GRATIS vs PAGO. La única diferencia entre los dos pagos es la
 * palabra "Premium" en el sello. No agregar más distinción sin pedirlo.
 */

export const isPaidPlan = (plan?: DoctorPlan | null): boolean =>
  plan === 'STANDARD' || plan === 'PREMIUM'

/** Realce del contenedor de una card: pago = anillo dorado, gratis = borde normal */
export function planCardClass(plan?: DoctorPlan | null): string {
  return isPaidPlan(plan)
    ? 'border-transparent ring-2 ring-brand-gold shadow-md'
    : 'border border-[var(--color-border)]'
}

export interface HeroTheme {
  paid: boolean
  wrap: string
  name: string
  eyebrow: string
  specialtyChip: string
  meta: string
  photoRing: string
  photoSize: string
  /** Franja de credenciales del hero (solo pago) */
  credStrip: string
  credLabel: string
  credValue: string
  /** Cabecera de la tarjeta CTA del sidebar */
  ctaHeader: string
  ctaEyebrow: string
}

/**
 * Tema del hero del perfil. El perfil pago tiene que leerse como "página de
 * revista": banda navy a sangre, glow dorado, foto grande con aro dorado y
 * antetítulo. El gratis queda plano.
 */
export function profileHeroTheme(plan?: DoctorPlan | null): HeroTheme {
  if (isPaidPlan(plan)) {
    return {
      paid: true,
      // El filete dorado superior va como borde; el glow lo pinta el page.
      wrap:
        'relative overflow-hidden rounded-[22px] shadow-[0_24px_60px_-28px_rgba(10,26,74,0.65)] ' +
        'bg-gradient-to-br from-[#0a1a4a] via-[#0f2560] to-[#132c6e] ' +
        'border border-brand-gold/35 border-t-4 border-t-brand-gold',
      name: 'text-white',
      eyebrow: 'text-brand-gold',
      specialtyChip:
        'bg-brand-gold/15 text-brand-gold ring-1 ring-brand-gold/40 hover:bg-brand-gold/25',
      meta: 'text-white/70',
      photoRing: 'ring-[3px] ring-brand-gold shadow-2xl shadow-brand-gold/30',
      photoSize: 'w-32 h-32 md:w-[178px] md:h-[178px]',
      credStrip: 'border-t border-white/10 bg-black/[0.16]',
      credLabel: 'text-white/55',
      credValue: 'text-white',
      ctaHeader:
        'bg-gradient-to-br from-[#0a1a4a] to-[#132c6e] border-b-[3px] border-brand-gold',
      ctaEyebrow: 'text-brand-gold',
    }
  }

  // Gratis: mismo orden y layout, sin los acabados dorados (§7 del handoff)
  return {
    paid: false,
    wrap: '',
    name: 'text-[var(--color-text-primary)]',
    eyebrow: '',
    specialtyChip: 'bg-[var(--color-primary,#001450)] text-white hover:opacity-90',
    meta: 'text-[var(--color-text-secondary)]',
    photoRing: 'border-2 border-[var(--color-border)]',
    photoSize: 'w-28 h-28 md:w-36 md:h-36',
    credStrip: '',
    credLabel: '',
    credValue: '',
    ctaHeader: 'bg-[var(--color-surface-2)] border-b border-[var(--color-border)]',
    ctaEyebrow: 'text-[var(--color-text-muted)]',
  }
}

interface Props {
  plan?: DoctorPlan | null
  size?: 'sm' | 'md'
  className?: string
}

/** Sello comercial de miembro. Devuelve null en el plan gratuito. */
export default function PlanBadge({ plan, size = 'sm', className = '' }: Props) {
  if (!isPaidPlan(plan)) return null

  const label = plan === 'PREMIUM' ? 'Miembro Premium' : 'Miembro'

  return (
    <span
      title={`${label} de la Guía Médica de Reporte Médico`}
      className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap bg-brand-gold text-[var(--color-primary,#001450)] shadow-sm ${
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      } ${className}`}
    >
      <Crown size={size === 'md' ? 14 : 11} strokeWidth={2} className="fill-current" />
      {label}
    </span>
  )
}
