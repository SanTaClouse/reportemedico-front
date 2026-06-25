import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { Playfair_Display, DM_Sans, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import ScrollToTop from '@/components/providers/ScrollToTop'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminFab from '@/components/layout/AdminFab'
import HideOnBio from '@/components/layout/HideOnBio'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-playfair',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-source-serif',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'
const SITE_TITLE = 'Reporte Médico — Noticias y salud en República Dominicana'
const SITE_DESCRIPTION =
  'El canal líder de noticias, investigación y difusión de salud en República Dominicana. Unimos el rigor de las especialidades médicas con el periodismo moderno.'

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: '%s | Reporte Médico',
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  applicationName: 'Reporte Médico',
  generator: 'Next.js',
  keywords: [
    'salud',
    'medicina',
    'República Dominicana',
    'noticias médicas',
    'artículos médicos',
    'especialistas',
    'reporte médico',
    'salud RD',
  ],
  authors: [{ name: 'Reporte Médico', url: SITE_URL }],
  creator: 'Reporte Médico',
  publisher: 'Reporte Médico',
  category: 'health',
  alternates: {
    canonical: '/',
    languages: {
      'es-DO': '/',
    },
    types: {
      'application/rss+xml': [
        { url: '/rss.xml', title: 'Reporte Médico — Últimas noticias' },
      ],
    },
  },
  openGraph: {
    siteName: 'Reporte Médico',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'es_DO',
    type: 'website',
    // La imagen por defecto se genera dinámicamente desde app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'Reporte Médico',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
    width: 600,
    height: 60,
  },
  sameAs: [
    'https://www.facebook.com/reportemedico',
    'https://www.instagram.com/reportemedico',
  ],
  description: SITE_DESCRIPTION,
  areaServed: {
    '@type': 'Country',
    name: 'República Dominicana',
  },
  inLanguage: 'es',
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Reporte Médico',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'es',
  publisher: {
    '@type': 'Organization',
    name: 'Reporte Médico',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/buscar?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} ${sourceSerif.variable} font-body bg-[var(--color-surface)] text-[var(--color-text-primary)]`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="light">
          {/* Sesión de médicos (Auth0). profileUrl apunta al SDK montado en /api/auth-medico */}
          <UserProvider profileUrl="/api/auth-medico/me">
            <ScrollToTop />
            <HideOnBio><Navbar /></HideOnBio>
            <main>{children}</main>
            <HideOnBio><Footer /></HideOnBio>
            <HideOnBio><AdminFab /></HideOnBio>
          </UserProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
