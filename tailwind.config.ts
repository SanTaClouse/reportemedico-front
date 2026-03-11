import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        article: ['Source Serif 4', 'Georgia', 'serif'],
      },
      colors: {
        // Tokens semánticos — cambian automáticamente con el tema
        primary: {
          DEFAULT: 'var(--color-primary)',
          light:   'var(--color-primary-light)',
          pale:    'var(--color-primary-pale)',
        },
        // Colores de marca fijos
        brand: {
          navy:        '#001450',
          'navy-mid':  '#142850',
          petroleum:   '#003C5A',
          electric:    '#0064C8',
          gold:        '#F0B414',
          'gold-light':'#F5C842',
          lila:        '#964B96',
        },
        editorial: {
          breaking: '#D63B2F',
          success:  '#1A7A4A',
        },
      },
      maxWidth: {
        article: '720px',
        site:    '1280px',
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'Source Serif 4, Georgia, serif',
            fontSize: '1.125rem',
            lineHeight: '1.75',
            color: '#0A1628',
            'h2, h3': {
              fontFamily: 'Playfair Display, Georgia, serif',
            },
            a: {
              color: '#0064C8',
            },
            blockquote: {
              borderLeftColor: '#F0B414',
            },
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
