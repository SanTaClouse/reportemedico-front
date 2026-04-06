import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Guía Médica',
  description: 'Directorio de médicos especialistas de República Dominicana. Próximamente.',
  alternates: { canonical: '/guia-medica' },
  openGraph: {
    title: 'Guía Médica | Reporte Médico',
    description: 'Directorio de médicos especialistas de República Dominicana. Próximamente.',
    url: '/guia-medica',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guía Médica | Reporte Médico',
    description: 'Directorio de médicos especialistas de República Dominicana. Próximamente.',
  },
}

export default function GuiaMedicaPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-pale)] flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">🩺</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-[var(--color-text-primary)] mb-3">
          Guía Médica
        </h1>
        <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-6">
          Estamos construyendo el directorio de médicos especialistas más completo de República Dominicana.
          Pronto podrás encontrar al especialista que necesitas.
        </p>
        <p className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-8">
          Próximamente
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}
