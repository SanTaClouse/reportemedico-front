'use client'
import { SectionError } from '@/components/ui/SectionError'

export default function MedicalArticleError({ reset }: { reset: () => void }) {
  return <SectionError reset={reset} message="No se pudo cargar el artículo médico." />
}
