'use client'

import { Phone, MapPin, MessageCircle } from 'lucide-react'
import { trackWhatsAppClick } from '@/lib/api-guia'

interface Props {
  doctorId: string
  doctorLabel: string
  phonePublic?: string | null
  phoneOffice?: string | null
}

/**
 * CTA de la ficha (04 §1.2): barra sticky inferior en mobile,
 * card lateral sticky en desktop (el padre la posiciona).
 */
export default function ProfileCta({ doctorId, doctorLabel, phonePublic, phoneOffice }: Props) {
  const callNumber = phoneOffice ?? phonePublic

  const handleWhatsApp = () => {
    if (!phonePublic) return
    trackWhatsAppClick(doctorId, 'profile')
    const message = encodeURIComponent(
      `Hola ${doctorLabel}, lo/la encontré en la Guía Médica de Reporte Médico y quisiera consultar por una cita.`,
    )
    window.open(`https://wa.me/${phonePublic.replace(/[^\d+]/g, '')}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const buttons = (
    <>
      {phonePublic && (
        <button
          onClick={handleWhatsApp}
          aria-label={`Contactar a ${doctorLabel} por WhatsApp`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={18} strokeWidth={2} /> WhatsApp
        </button>
      )}
      {callNumber && (
        <a
          href={`tel:${callNumber.replace(/[^\d+]/g, '')}`}
          aria-label={`Llamar a ${doctorLabel}`}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/40 transition-colors"
        >
          <Phone size={16} strokeWidth={2} /> Llamar
        </a>
      )}
      <a
        href="#donde-atiende"
        aria-label="Ver ubicación en el mapa"
        className="flex items-center justify-center gap-2 px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/40 transition-colors"
      >
        <MapPin size={16} strokeWidth={2} /> Mapa
      </a>
    </>
  )

  return (
    <>
      {/* Mobile: barra sticky inferior, siempre visible al scrollear */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] p-3 flex gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        {buttons}
      </div>
      {/* Desktop: card en la columna lateral (el padre da el sticky) */}
      <div className="hidden lg:flex flex-col gap-2">{buttons}</div>
    </>
  )
}
