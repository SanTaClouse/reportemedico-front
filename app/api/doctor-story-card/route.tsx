import { NextRequest, NextResponse } from 'next/server'
import { getDoctorBySlug } from '@/lib/api-guia'
import { renderDoctorStoryCard } from '@/lib/og-image'

export const runtime = 'nodejs'

/**
 * GET /api/doctor-story-card?slug=<slug>
 *
 * Genera la imagen vertical 1080×1920 (formato Stories) del perfil del médico:
 * foto + nombre + especialidad + marca + link. La consume el botón "Imagen para
 * historia" de ShareProfile, que la descarga como File y la pasa a
 * navigator.share({ files }) (en mobile → "Añadir a tu historia").
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug requerido' }, { status: 400 })
  }

  try {
    const doctor = await getDoctorBySlug(slug)
    const name = `${doctor.title ?? ''} ${doctor.firstName} ${doctor.lastName}`.trim()
    const specialty = doctor.specialties?.[0]?.specialty?.name ?? null
    return renderDoctorStoryCard({ name, specialty, photoUrl: doctor.photoUrl ?? null, slug: doctor.slug })
  } catch {
    return NextResponse.json({ error: 'médico no encontrado' }, { status: 404 })
  }
}
