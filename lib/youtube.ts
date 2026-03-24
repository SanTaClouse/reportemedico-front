export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
}

const CHANNEL_HANDLE = 'reportemedico1504'

export async function getChannelVideos(maxResults = 12): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return []

  try {
    // 1. Obtener el uploads playlist ID del canal
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${CHANNEL_HANDLE}&key=${apiKey}`,
      { next: { revalidate: 3600 } },
    )
    if (!channelRes.ok) return []
    const channelData = await channelRes.json()
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsId) return []

    // 2. Obtener los videos del playlist de uploads
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsId}&maxResults=${maxResults}&key=${apiKey}`,
      { next: { revalidate: 3600 } },
    )
    if (!videosRes.ok) return []
    const videosData = await videosRes.json()

    return (videosData.items ?? []).map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
    }))
  } catch {
    return []
  }
}
