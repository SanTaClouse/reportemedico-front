import type { Metadata } from 'next'
import Link from 'next/link'
import { Stethoscope, Check, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Regístrate como médico — Guía Médica',
  description:
    'Crea tu perfil profesional gratis en la Guía Médica de Reporte Médico: aparece en las búsquedas de pacientes, recibe contactos por WhatsApp y publica artículos sin recargar tus datos.',
  alternates: { canonical: '/registro-medicos' },
  robots: { index: true, follow: true },
}

const FREE_BENEFITS = [
  'Tu página profesional con SEO local (te encuentran en Google)',
  'Apareces en las búsquedas por seguro, especialidad y ciudad',
  'Contacto directo de pacientes por WhatsApp',
  'Envías artículos sin volver a cargar tus datos',
]

const PREMIUM_BENEFITS = [
  'Publicación en la revista digital e impresa',
  'Sesión de fotografía profesional',
  'Video de presentación en tu perfil',
  'Invitaciones al podcast como especialista',
  'Invitaciones VIP a eventos médicos',
]

// returnTo lleva al médico al onboarding tras autenticarse
const SIGNUP_URL = '/api/auth-medico/login?returnTo=/mi-cuenta'

export default function RegistroMedicosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary,#001450)] flex items-center justify-center mx-auto mb-4">
          <Stethoscope size={26} className="text-[var(--color-accent,#F0B414)]" strokeWidth={1.5} />
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
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Crear mi perfil gratis
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Con tu cuenta de Google o con email y contraseña.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gratis */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <p className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-1">
            Esto ya es tuyo, gratis
          </p>
          <ul className="mt-4 space-y-2.5">
            {FREE_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <Check size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Premium */}
        <div className="bg-[var(--color-primary,#001450)] rounded-2xl border border-[var(--color-primary,#001450)] p-6 text-white">
          <p className="font-display font-bold text-lg mb-1">Con Premium sumás</p>
          <ul className="mt-4 space-y-2.5">
            {PREMIUM_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-white/85">
                <Check size={16} className="text-[var(--color-accent,#F0B414)] shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/60 mt-4">
            <MessageCircle size={12} className="inline mr-1" />
            La activación de Premium la coordina el equipo de Reporte Médico.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--color-text-muted)] mt-8">
        ¿Ya tienes cuenta?{' '}
        <Link href={SIGNUP_URL} className="text-[var(--color-primary)] font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
