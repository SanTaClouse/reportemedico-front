export function getShareUrls(title: string, url: string) {
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url)

  return {
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
