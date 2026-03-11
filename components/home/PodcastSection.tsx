import type { PodcastEpisode } from '@/lib/api'
import SectionTitle from '@/components/ui/SectionTitle'
import Image from 'next/image'

interface PodcastSectionProps {
  episodes: PodcastEpisode[]
}

export default function PodcastSection({ episodes }: PodcastSectionProps) {
  const [featured, ...rest] = episodes

  const getThumbnail = (youtubeId: string) =>
    `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`

  return (
    <section className="bg-[var(--color-surface-2)] py-14">
      <div className="max-w-site mx-auto px-4 md:px-6">
        <SectionTitle>Nuestro Podcast</SectionTitle>

        {featured && (
          <div className="mb-8">
            <div className="aspect-video w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-md">
              <iframe
                src={`https://www.youtube.com/embed/${featured.youtubeId}`}
                title={featured.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-center text-sm text-[var(--color-text-secondary)] mt-3">
              {featured.title}
            </p>
          </div>
        )}

        {rest.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {rest.map((ep) => (
              <a
                key={ep.id}
                href={`https://www.youtube.com/watch?v=${ep.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-44 group"
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-[var(--color-border)] mb-2 img-hover">
                  <Image
                    src={ep.thumbnailUrl || getThumbnail(ep.youtubeId)}
                    alt={ep.title}
                    width={176}
                    height={99}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                  {ep.title}
                </p>
              </a>
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <a
            href="https://www.youtube.com/@reportemedico1504"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Ver todos en YouTube ↗
          </a>
        </div>
      </div>
    </section>
  )
}
