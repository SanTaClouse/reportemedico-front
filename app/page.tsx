import { getHomeData, getPodcastEpisodes, getPrintEditions, PodcastEpisode } from '@/lib/api'
import { getChannelVideos } from '@/lib/youtube'
import HeroSection from '@/components/home/HeroSection'
import FeaturedGrid from '@/components/home/FeaturedGrid'
import ActualidadSection from '@/components/home/ActualidadSection'
import MedicalArticlesSection from '@/components/home/MedicalArticlesSection'
import PodcastSection from '@/components/home/PodcastSection'
import EditionsSection from '@/components/home/EditionsSection'
import AboutSection from '@/components/home/AboutSection'
import ScrollReveal from '@/components/ui/ScrollReveal'
import SectionDots from '@/components/ui/SectionDots'
import AdSlotRenderer from '@/components/ads/AdSlotRenderer'

export const revalidate = 300 // 5 min ISR

export default async function HomePage() {
  const [home, podcasts, editions, channelVideos] = await Promise.all([
    getHomeData(),
    getPodcastEpisodes(),
    getPrintEditions(),
    getChannelVideos(16),
  ])

  const FALLBACK_PODCAST: PodcastEpisode = {
    id: 'fallback',
    title: 'Reporte Médico — Video Podcast',
    youtubeId: 'Ws2k9PxaYu4',
    thumbnailUrl: 'https://img.youtube.com/vi/Ws2k9PxaYu4/maxresdefault.jpg',
    description: '',
    order: 0,
    isVisible: true,
    publishedAt: new Date().toISOString(),
  }
  const podcastEpisodes = podcasts.data.length > 0 ? podcasts.data : [FALLBACK_PODCAST]

  return (
    <>
      {home.hero && <HeroSection article={home.hero} />}

      <AdSlotRenderer position="banner_home_1" className="max-w-site mx-auto px-4 md:px-6 mt-4" />

      <SectionDots />

      <div className="max-w-site mx-auto px-4 md:px-6 py-10 space-y-14">
        {(home.lead || home.bigFeatured.length > 0 || home.smallFeatured.length > 0) && (
          <div id="sec-destacadas">
            <ScrollReveal>
              <FeaturedGrid
                lead={home.lead}
                bigFeatured={home.bigFeatured}
                smallFeatured={home.smallFeatured}
              />
            </ScrollReveal>
          </div>
        )}

        <AdSlotRenderer position="banner_home_2" />

        {(home.actualidad ?? []).length > 0 && (
          <div id="sec-actualidad">
            <ScrollReveal delay={80}>
              <ActualidadSection articles={home.actualidad ?? []} />
            </ScrollReveal>
          </div>
        )}

        <AdSlotRenderer position="banner_home_3" />

        {home.medicalArticles.length > 0 && (
          <div id="sec-articulos">
            <ScrollReveal delay={80}>
              <MedicalArticlesSection articles={home.medicalArticles} />
            </ScrollReveal>
          </div>
        )}

        <AdSlotRenderer position="banner_home_4" />
      </div>

      <div id="sec-podcast">
        <ScrollReveal>
          <PodcastSection episodes={podcastEpisodes} channelVideos={channelVideos} />
        </ScrollReveal>
      </div>

      <AdSlotRenderer position="banner_home_5" className="max-w-site mx-auto px-4 md:px-6" />

      {editions.length > 0 && (
        <div id="sec-ediciones">
          <ScrollReveal>
            <EditionsSection editions={editions} />
          </ScrollReveal>
        </div>
      )}

      <div id="sec-nosotros">
        <ScrollReveal>
          <AboutSection />
        </ScrollReveal>
      </div>
    </>
  )
}
