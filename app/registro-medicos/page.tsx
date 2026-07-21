import type { Metadata } from 'next'
import Link from 'next/link'
import { Stethoscope, Check, Minus, MessageCircle, Star } from 'lucide-react'
import { getSpecialties, type DoctorPlan, type Specialty } from '@/lib/api-guia'
import PlanCta from '@/components/guia/PlanCta'

export const metadata: Metadata = {
  title: 'Regístrate como médico — Guía Médica',
  description:
    'Crea tu perfil profesional gratis en la Guía Médica de Reporte Médico: aparece en las búsquedas de pacientes, recibe contactos por WhatsApp y publica artículos sin recargar tus datos.',
  alternates: { canonical: '/registro-medicos' },
  robots: { index: true, follow: true },
}

// returnTo lleva al médico al onboarding tras autenticarse
const SIGNUP_URL = '/api/auth-medico/login?returnTo=/mi-cuenta'

/**
 * Links de pago del banco (los provee Alberto).
 * ⚠️ [A RESOLVER]: con el flujo nuevo el CTA abre la captura de lead y sigue a
 * Auth0, así que el link de pago YA NO tiene lugar en este botón. Hay que
 * decidir dónde entra (¿después de crear la cuenta? ¿se lo manda ventas?).
 * Por ahora solo cambia el texto del botón.
 */
const PAYMENT_URLS: Record<string, string | undefined> = {
  estandar: process.env.NEXT_PUBLIC_PAY_URL_ESTANDAR,
  premium: process.env.NEXT_PUBLIC_PAY_URL_PREMIUM,
}

/** El texto dice lo que el botón realmente hace */
function planCtaLabel(plan: Plan) {
  if (plan.key === 'basica') return 'Crear mi perfil gratis'
  if (PAYMENT_URLS[plan.key]) return `Contratar plan ${plan.name}`
  return `Quiero el plan ${plan.name}`
}

/**
 * Precios de los planes.
 * ⚠️ [A DEFINIR — Alberto, 2026-07-21]: placeholders. Poner el monto real acá y
 * se refleja en las tres cards. `null` oculta la línea de precio del plan.
 */
const PRICING: Record<string, { price: string | null; period: string | null }> = {
  basica: { price: 'Gratis', period: 'para siempre' },
  estandar: { price: 'RD$ —', period: 'por año' },
  premium: { price: 'RD$ —', period: 'por año' },
}

interface Plan {
  key: string
  /** Valor real del enum DoctorPlan — `key` es solo el slug para PRICING/copy */
  enumKey: DoctorPlan
  name: string
  tagline: string
  highlight?: string
  features: string[]
  /** Ítems que el plan NO incluye — diferenciador visible pedido por el cliente */
  missing?: string[]
  inherits?: string
  featured?: boolean
}

const PLANS: Plan[] = [
  {
    key: 'basica',
    enumKey: 'BASIC',
    name: 'Básica',
    tagline: 'Empieza a aparecer en la guía sin costo.',
    // MODELO DE DOS SELLOS (confirmado con el cliente, 2026-07-21):
    //   ✓ exequátur verificado → GRATIS, lo activa el admin al comprobar la
    //     matrícula. Nunca se compra (doc 00 §7.2).
    //   ★ Miembro de la Guía  → sello COMERCIAL, viene con los planes pagos.
    // Por eso la Básica sí puede llevar el ✓ y lo que le falta es el ★.
    features: [
      'Tu foto profesional',
      'Tu especialidad',
      'Un dato de consulta (dirección del consultorio)',
      'Apareces en las búsquedas de pacientes',
      'Sello ✓ de exequátur verificado, sin costo',
    ],
    missing: ['Sin sello de Miembro de la Guía', 'Sin video ni botón de WhatsApp'],
  },
  {
    key: 'estandar',
    enumKey: 'STANDARD',
    name: 'Estándar',
    tagline: 'Todo lo que necesitas para que te encuentren y te contacten.',
    highlight: 'La más vendida',
    featured: true,
    features: [
      'Sello ★ de Miembro de la Guía Médica en tu perfil',
      'Apareces en la guía médica impresa y digital',
      'Video de presentación en tu perfil',
      'Todos tus datos de consulta',
      'Botón de WhatsApp para contacto directo',
      'SEO: te encuentran en Google por tu nombre y especialidad',
      'Invitación a nuestros eventos',
    ],
  },
  {
    key: 'premium',
    enumKey: 'PREMIUM',
    name: 'Premium',
    tagline: 'El paquete completo, para el médico que construye autoridad.',
    inherits: 'Estándar',
    features: [
      'Publicación de artículos médicos en la edición impresa (las 6 ediciones)',
      'Sesión fotográfica VIP',
      'Video corporativo',
      'Invitación periódica a nuestros programas de podcast',
    ],
  },
]

export default async function RegistroMedicosPage() {
  // Alimentan el select del modal de captura
  const specialties = await getSpecialties().catch(() => [])

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary,#001450)] flex items-center justify-center mx-auto mb-4">
          <Stethoscope size={26} className="text-brand-gold" strokeWidth={1.5} />
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-[var(--color-text-primary)] mb-3">
          Súmate a la Guía Médica
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base max-w-xl mx-auto">
          Crea tu perfil profesional <strong>gratis</strong> y conecta con los pacientes que están
          buscando un especialista como tú en República Dominicana.
        </p>
        <Link
          href={SIGNUP_URL}
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-brand-gold text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Crear mi perfil gratis
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Con tu cuenta de Google o con email y contraseña.
        </p>
      </div>

      {/* ─── Texto institucional (copy de la revista impresa) ──────────────── */}
      <section
        aria-labelledby="membresia"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#001450] via-[#0A1E5E] to-[#142a6e] px-6 py-8 md:px-10 md:py-10 mb-12 ring-1 ring-brand-gold/20"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_10%,rgba(240,180,20,0.18),transparent_55%)] pointer-events-none"
        />
        <div className="relative max-w-3xl">
          <h2 id="membresia" className="font-display font-bold text-2xl md:text-3xl text-white mb-5">
            Únete a nuestra Guía Médica
          </h2>
          <div className="space-y-4 text-white/85 text-sm md:text-base leading-relaxed">
            <p>
              Formar parte de la{' '}
              <strong className="text-white">Guía Médica de Reporte Médico</strong> no es
              simplemente adquirir un espacio publicitario: es consolidar tu nombre en un círculo de
              alta distinción profesional. Esta membresía exclusiva está diseñada para el médico de
              trayectoria que comprende que su reputación merece ser proyectada con el más alto
              estándar institucional.
            </p>
            <p>
              Nuestra plataforma destaca por contar con un{' '}
              <Link
                href="/consejo-medico"
                className="text-brand-gold font-semibold hover:underline underline-offset-2"
              >
                Consejo Médico Editorial
              </Link>{' '}
              integrado por doctores de alto nivel, respaldado por una dirección experta en
              marketing médico. Esta sinergia institucional garantiza que las principales patologías
              de tu área sean proyectadas con un enfoque estratégico y un rigor científico
              impecable, comunicando salud de manera masiva y transformando tu conocimiento en la
              opción preferida de los pacientes.
            </p>
          </div>
          <p className="font-display font-bold text-lg md:text-xl text-brand-gold mt-6">
            Llega a más personas: añade tu perfil profesional hoy mismo.
          </p>
        </div>
      </section>

      {/* ─── Planes ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="planes">
        <div className="text-center mb-8">
          <h2
            id="planes"
            className="font-display font-bold text-2xl md:text-3xl text-[var(--color-text-primary)] mb-2"
          >
            Elige tu plan
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Empieza gratis y sube de plan cuando quieras.
          </p>
        </div>

        {/* stretch: las tres cards igualan altura y los CTA quedan alineados abajo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 lg:gap-5 items-stretch">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} specialties={specialties} />
          ))}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-6 text-center">
          <MessageCircle size={13} strokeWidth={1.5} className="shrink-0" />
          La activación de los planes pagos la coordina el equipo de Reporte Médico.
        </p>
      </section>

      <p className="text-center text-sm text-[var(--color-text-muted)] mt-10">
        ¿Ya tienes cuenta?{' '}
        <Link href={SIGNUP_URL} className="text-[var(--color-primary)] font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}

// ─── Card de plan ─────────────────────────────────────────────────────────

function PlanCard({ plan, specialties }: { plan: Plan; specialties: Specialty[] }) {
  const { price, period } = PRICING[plan.key] ?? { price: null, period: null }
  const featured = plan.featured

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col h-full transition-shadow ${
        featured
          ? 'bg-[var(--color-primary,#001450)] text-white ring-2 ring-brand-gold shadow-xl md:-mt-3 md:pt-9'
          : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-md'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-gold text-[var(--color-primary,#001450)] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap shadow-sm">
          <Star size={11} strokeWidth={2.5} className="fill-current" />
          {plan.highlight}
        </span>
      )}

      <p
        className={`font-display font-bold text-xl ${
          featured ? 'text-white' : 'text-[var(--color-text-primary)]'
        }`}
      >
        {plan.name}
      </p>
      <p
        className={`text-sm mt-1 leading-snug ${
          featured ? 'text-white/75' : 'text-[var(--color-text-secondary)]'
        }`}
      >
        {plan.tagline}
      </p>

      {price && (
        <p className="mt-5 flex items-baseline gap-1.5">
          <span
            className={`font-display font-bold text-3xl ${
              featured ? 'text-brand-gold' : 'text-[var(--color-text-primary)]'
            }`}
          >
            {price}
          </span>
          {period && (
            <span
              className={`text-xs ${featured ? 'text-white/60' : 'text-[var(--color-text-muted)]'}`}
            >
              {period}
            </span>
          )}
        </p>
      )}

      <div className={`mt-5 pt-5 border-t ${featured ? 'border-white/15' : 'border-[var(--color-border)]'}`}>
        {plan.inherits && (
          <p
            className={`text-sm font-semibold mb-3 ${
              featured ? 'text-white' : 'text-[var(--color-text-primary)]'
            }`}
          >
            Todo lo del plan {plan.inherits}, más:
          </p>
        )}
        <ul className="space-y-2.5">
          {plan.features.map((f) => (
            <li
              key={f}
              className={`flex items-start gap-2 text-sm ${
                featured ? 'text-white/85' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <Check
                size={16}
                strokeWidth={2}
                className={`shrink-0 mt-0.5 ${
                  featured ? 'text-brand-gold' : 'text-[var(--color-primary)]'
                }`}
              />
              {f}
            </li>
          ))}
          {plan.missing?.map((m) => (
            <li
              key={m}
              className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
            >
              <Minus size={16} strokeWidth={2} className="shrink-0 mt-0.5 opacity-60" />
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* mt-auto en el CONTENEDOR, no en el botón: si va en el botón le come el
          padding y el texto queda descentrado */}
      <div className="mt-auto pt-6">
        <PlanCta
          plan={plan.enumKey}
          planLabel={plan.name}
          label={planCtaLabel(plan)}
          featured={Boolean(featured)}
          specialties={specialties}
        />
      </div>
    </div>
  )
}
