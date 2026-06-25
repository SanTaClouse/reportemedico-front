import {
  Link2,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Newspaper,
  Mic,
  Stethoscope,
  Calendar,
  MapPin,
  Heart,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

/** Mapa de íconos disponibles para los enlaces del bio (clave → componente lucide). */
export const BIO_ICONS: Record<string, LucideIcon> = {
  link: Link2,
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
  phone: Phone,
  mail: Mail,
  globe: Globe,
  newspaper: Newspaper,
  mic: Mic,
  stethoscope: Stethoscope,
  calendar: Calendar,
  map: MapPin,
  heart: Heart,
  book: BookOpen,
}

/** Resuelve la clave de ícono a un componente lucide; cae en Link2 por defecto. */
export function bioIcon(key?: string | null): LucideIcon {
  return (key && BIO_ICONS[key]) || Link2
}

/** Opciones para el selector de ícono del panel admin. */
export const BIO_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'link', label: 'Enlace' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'mail', label: 'Correo' },
  { value: 'globe', label: 'Sitio web' },
  { value: 'newspaper', label: 'Noticias' },
  { value: 'mic', label: 'Podcast' },
  { value: 'stethoscope', label: 'Guía médica' },
  { value: 'calendar', label: 'Eventos' },
  { value: 'map', label: 'Ubicación' },
  { value: 'heart', label: 'Salud' },
  { value: 'book', label: 'Ediciones' },
]
