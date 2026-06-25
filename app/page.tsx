import { getHomeData, getPodcastEpisodes, getPrintEditions, PodcastEpisode } from '@/lib/api'
import { getChannelVideos } from '@/lib/youtube'
import HeroSection from '@/components/home/HeroSection'
import FeaturedGrid from '@/components/home/FeaturedGrid'
import ActualidadSection from '@/components/home/ActualidadSection'
import MedicalArticlesSection from '@/components/home/MedicalArticlesSection'
import PodcastSection from '@/components/home/PodcastSection'
import EditionsSection from '@/components/home/EditionsSection'
import FeaturedDoctors from '@/components/home/FeaturedDoctors'
import GuiaMedicaBanner from '@/components/home/GuiaMedicaBanner'
import AboutSection from '@/components/home/AboutSection'
import WhatsAppChannelBanner from '@/components/home/WhatsAppChannelBanner'
import ScrollReveal from '@/components/ui/ScrollReveal'
import SectionDots from '@/components/ui/SectionDots'
import AdSlotRenderer from '@/components/ads/AdSlotRenderer'

export const revalidate = 300 // 5 min ISR

export default async function HomePage() {
  const results = await Promise.allSettled([
    getHomeData(),
    getPodcastEpisodes(),
    getPrintEditions(),
    getChannelVideos(16),
  ])
  const home = results[0].status === 'fulfilled' ? results[0].value : { hero: null, lead: null, bigFeatured: [], smallFeatured: [], actualidad: [], medicalArticles: [] }
  const podcasts = results[1].status === 'fulfilled' ? results[1].value : { data: [] }
  const editions = results[2].status === 'fulfilled' ? results[2].value : []
  const channelVideos = results[3].status === 'fulfilled' ? results[3].value : []

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

        <div id="sec-guia" className="space-y-8">
          <ScrollReveal delay={80}>
            <FeaturedDoctors />
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <GuiaMedicaBanner />
          </ScrollReveal>
        </div>

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

      <div className="w-full bg-[var(--color-surface-2)] pb-5">
        <AdSlotRenderer position="banner_home_5" className="max-w-site mx-auto px-4 md:px-6" />
      </div>

      {editions.length > 0 && (
        <div id="sec-ediciones">
          <ScrollReveal>
            <EditionsSection editions={editions} />
          </ScrollReveal>
        </div>
      )}

      <AdSlotRenderer position="banner_home_6" className="max-w-site mx-auto px-4 md:px-6 mt-6" />

      <div id="sec-nosotros">
        <ScrollReveal>
          <AboutSection />
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <WhatsAppChannelBanner />
      </ScrollReveal>
    </>
  )
}
