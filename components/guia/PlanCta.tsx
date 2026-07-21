'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import PlanLeadModal from './PlanLeadModal'
import type { DoctorPlan, Specialty } from '@/lib/api-guia'

interface Props {
  plan: DoctorPlan
  planLabel: string
  label: string
  featured: boolean
  specialties: Specialty[]
}

/**
 * CTA de una card de plan. Abre la captura de lead en vez de mandar directo a
 * Auth0: así el dato queda guardado aunque el médico abandone el registro.
 * Aplica también al plan gratuito — los básicos SON la lista de upsell de Alberto.
 */
export default function PlanCta({ plan, planLabel, label, featured, specialties }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full px-5 py-3 inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 ${
          featured
            ? 'bg-brand-gold text-[var(--color-primary,#001450)]'
            : 'border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary-pale,#e8edf8)]'
        }`}
      >
        {label}
        <ArrowRight size={14} strokeWidth={2.2} className="shrink-0" />
      </button>

      {open && (
        <PlanLeadModal
          plan={plan}
          planLabel={planLabel}
          specialties={specialties}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
