'use client'
import { SectionError } from '@/components/ui/SectionError'

export default function NewsError({ reset }: { reset: () => void }) {
  return <SectionError reset={reset} message="No se pudieron cargar las noticias." />
}
