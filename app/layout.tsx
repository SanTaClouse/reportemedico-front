import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import ScrollToTop from '@/components/providers/ScrollToTop'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminFab from '@/components/layout/AdminFab'

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

export const metadata: Metadata = {
  title: {
    default: 'Reporte Médico — Salud e Información Médica',
    template: '%s | Reporte Médico',
  },
  description: 'La plataforma de salud líder en República Dominicana. Noticias médicas, artículos de especialistas y más.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'),
  openGraph: {
    siteName: 'Reporte Médico',
    locale: 'es_DO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Reporte Médico',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com',
  logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://reportemedico.com'}/logo.png`,
  sameAs: [
    'https://www.facebook.com/reportemedico',
    'https://twitter.com/reportemedico',
    'https://www.instagram.com/reportemedico',
  ],
  description: 'La plataforma de salud líder en República Dominicana.',
  areaServed: 'DO',
  inLanguage: 'es',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} ${sourceSerif.variable} font-body bg-[var(--color-surface)] text-[var(--color-text-primary)]`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ThemeProvider attribute="data-theme" defaultTheme="light">
          <ScrollToTop />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <AdminFab />
        </ThemeProvider>
      </body>
    </html>
  )
}
