import { useEffect } from 'react'
import { useClientStore } from '@/store'
import Landing from '@/components/landing/Landing'

// Page-level concerns only: SEO tags per language and the browser chrome colour.
// The page itself lives in components/landing.
const META_TAGS = {
  en: {
    title: 'LoyalCard - Digital Loyalty Card | Free Customer Rewards Program',
    description: 'Free digital loyalty card platform for businesses. Create mobile loyalty programs, reward customers, and boost retention. No setup fees. Start in 2 minutes!',
    keywords: 'digital loyalty card, customer rewards app, free loyalty program, digital punch card, mobile loyalty card',
    canonical: 'https://loyalcard.net/'
  },
  it: {
    title: 'LoyalCard - Carta Fedeltà Digitale | Programma Fedeltà Gratuito',
    description: 'Piattaforma gratuita di carte fedeltà digitali per aziende. Crea programmi fedeltà mobile, premia i clienti e aumenta la fidelizzazione. Inizia in 2 minuti!',
    keywords: 'carta fedeltà digitale, app premi clienti, programma fedeltà gratuito, tessera fedeltà digitale, carta fedeltà mobile',
    canonical: 'https://loyalcard.net/?lang=it'
  },
  ro: {
    title: 'LoyalCard - Card de Fidelitate Digital | Program Loialitate Gratuit',
    description: 'Platformă gratuită de carduri de fidelitate digitale pentru afaceri. Creează programe de loialitate mobile, recompensează clienții și crește retenția. Fără costuri!',
    keywords: 'card de fidelitate digital, aplicație recompense clienți, program loialitate gratuit, card digital puncte, card loialitate mobil',
    canonical: 'https://loyalcard.net/?lang=ro'
  }
}

// Same as <meta name="theme-color"> in index.html (#8b5cf6) for every other page.
const LANDING_THEME_COLOR = '#0b0907'

export default function LandingPage() {
  const { language } = useClientStore()

  // Update meta tags based on language
  useEffect(() => {
    const meta = META_TAGS[language as keyof typeof META_TAGS] || META_TAGS.en

    document.title = meta.title

    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('name', name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    updateMetaTag('description', meta.description)
    updateMetaTag('keywords', meta.keywords)

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = meta.canonical

    // Update html lang attribute
    document.documentElement.lang = language
  }, [language])

  // The landing is dark: tint the browser's address bar to match, and put it back on leave.
  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    const previous = themeMeta?.getAttribute('content') ?? null
    themeMeta?.setAttribute('content', LANDING_THEME_COLOR)
    return () => {
      if (themeMeta && previous !== null) themeMeta.setAttribute('content', previous)
    }
  }, [])

  return <Landing />
}
