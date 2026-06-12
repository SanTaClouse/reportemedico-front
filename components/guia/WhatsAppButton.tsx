'use client'

import { MessageCircle } from 'lucide-react'
import { trackWhatsAppClick } from '@/lib/api-guia'

interface Props {
  doctorId: string
  phone: string
  doctorLabel: string // "Dra. Pérez" — para el mensaje pre-armado
  source: 'profile' | 'search-card' | 'clinic-page'
  variant?: 'primary' | 'compact'
}

/**
 * CTA principal de conversión (P5). El mensaje pre-armado le dice al médico
 * que el contacto vino de la guía — refuerza el valor de la suscripción.
 */
export default function WhatsAppButton({ doctorId, phone, doctorLabel, source, variant = 'primary' }: Props) {
  const handleClick = () => {
    trackWhatsAppClick(doctorId, source) // fire-and-forget
    const message = encodeURIComponent(
      `Hola ${doctorLabel}, lo/la encontré en la Guía Médica de Reporte Médico y quisiera consultar por una cita.`,
    )
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        aria-label={`Contactar a ${doctorLabel} por WhatsApp`}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={14} strokeWidth={2} /> WhatsApp
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      aria-label={`Contactar a ${doctorLabel} por WhatsApp`}
      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
    >
      <MessageCircle size={18} strokeWidth={2} /> Contactar por WhatsApp
    </button>
  )
}
