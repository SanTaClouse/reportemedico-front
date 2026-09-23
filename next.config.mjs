/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'image.isu.pub',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        // Fotos de perfil de Google/Auth0 (default del médico hasta que suba la suya)
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },
  // Links cortos para compartir en historias y WhatsApp (docs/v2/11).
  // Temporales (307): al terminar el evento se apuntan al siguiente foro.
  async redirects() {
    return [
      { source: '/foro', destination: '/eventos/foro-salud-5', permanent: false },
      { source: '/foro/inscripcion', destination: '/eventos/foro-salud-5/inscripcion', permanent: false },
      { source: '/inscripcion-foro', destination: '/eventos/foro-salud-5/inscripcion', permanent: false },
    ]
  },
}

export default nextConfig
