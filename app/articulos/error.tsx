'use client'
import { SectionError } from '@/components/ui/SectionError'

export default function ArticlesError({ reset }: { reset: () => void }) {
  return <SectionError reset={reset} message="No se pudieron cargar los artículos médicos." />
}
