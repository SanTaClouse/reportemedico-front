import { getHomeData, getPodcastEpisodes, getPrintEditions } from '@/lib/api'
import HeroSection from '@/components/home/HeroSection'
import FeaturedGrid from '@/components/home/FeaturedGrid'
import LatestNews from '@/components/home/LatestNews'
import MedicalArticlesSection from '@/components/home/MedicalArticlesSection'
import PodcastSection from '@/components/home/PodcastSection'
import EditionsSection from '@/components/home/EditionsSection'
import AboutSection from '@/components/home/AboutSection'

export const revalidate = 300 // 5 min ISR

export default async function HomePage() {
  const [home, podcasts, editions] = await Promise.all([
    getHomeData(),
    getPodcastEpisodes(),
    getPrintEditions(),
  ])

  // Episodio de podcast por defecto si el backend aún no tiene datos
  const FALLBACK_PODCAST = {
    id: 'fallback',
    title: 'Reporte Médico — Video Podcast',
    youtubeId: 'Ws2k9PxaYu4',
    thumbnailUrl: 'https://img.youtube.com/vi/Ws2k9PxaYu4/maxresdefault.jpg',
    description: '',
    order: 0,
  }
  const podcastEpisodes = podcasts.length > 0 ? podcasts : [FALLBACK_PODCAST]

  return (
    <>
      {home.hero && <HeroSection article={home.hero} />}

      <div className="max-w-site mx-auto px-4 md:px-6 py-10 space-y-14">
        {home.featured.length > 0 && <FeaturedGrid articles={home.featured} />}
        {home.latest.length > 0 && <LatestNews articles={home.latest} />}
        {home.medicalArticles.length > 0 && <MedicalArticlesSection articles={home.medicalArticles} />}
      </div>

      <PodcastSection episodes={podcastEpisodes} />
      {editions.length > 0 && <EditionsSection editions={editions} />}
      <AboutSection />
    </>
  )
}
