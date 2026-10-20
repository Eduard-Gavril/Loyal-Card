// Single source of truth for per-page SEO data. Used by the pages at runtime and by scripts/prerender.mjs at build time.
export type SeoLang = 'en' | 'it' | 'ro'

export const SITE_URL = 'https://loyalcard.net'

/** One real URL per language: crawlers cannot choose a language, so each one needs its own address. */
export const LANDING_PATH: Record<SeoLang, string> = { en: '/', it: '/it', ro: '/ro' }

export const OG_LOCALE: Record<SeoLang, string> = { en: 'en_US', it: 'it_IT', ro: 'ro_RO' }

export const LANDING_META: Record<SeoLang, { title: string; description: string; keywords: string }> = {
  en: {
    title: 'LoyalCard - Digital Loyalty Card | Free Customer Rewards Program',
    description: 'Free digital loyalty card platform for businesses. Create mobile loyalty programs, reward customers, and boost retention. No setup fees. Start in 2 minutes!',
    keywords: 'digital loyalty card, customer rewards app, free loyalty program, digital punch card, mobile loyalty card',
  },
  it: {
    title: 'LoyalCard - Carta Fedeltà Digitale | Programma Fedeltà Gratuito',
    description: 'Piattaforma gratuita di carte fedeltà digitali per aziende. Crea programmi fedeltà mobile, premia i clienti e aumenta la fidelizzazione. Inizia in 2 minuti!',
    keywords: 'carta fedeltà digitale, app premi clienti, programma fedeltà gratuito, tessera fedeltà digitale, carta fedeltà mobile',
  },
  ro: {
    title: 'LoyalCard - Card de Fidelitate Digital | Program Loialitate Gratuit',
    description: 'Platformă gratuită de carduri de fidelitate digitale pentru afaceri. Creează programe de loialitate mobile, recompensează clienții și crește retenția. Fără costuri!',
    keywords: 'card de fidelitate digital, aplicație recompense clienți, program loialitate gratuit, card digital puncte, card loialitate mobil',
  },
}

/** Public pages other than the landing that are rendered to static HTML and listed in the sitemap. */
export const STATIC_PAGES: Record<string, { title: string; description: string }> = {
  '/pricing': {
    title: 'Pricing - Digital Loyalty Card Plans | LoyalCard',
    description: 'LoyalCard plans from free to enterprise: loyalty rules, analytics, white-label and staff accounts. Start free, upgrade when your business grows.',
  },
  '/contact': {
    title: 'Contact Us | LoyalCard',
    description: 'Questions about LoyalCard? Send us a message or reach us on Instagram. We reply to businesses and customers alike.',
  },
  '/privacy': {
    title: 'Privacy Policy | LoyalCard',
    description: 'How LoyalCard collects, uses and protects personal information for businesses and customers.',
  },
  '/terms': {
    title: 'Terms of Service | LoyalCard',
    description: 'The terms that apply when you use the LoyalCard digital loyalty platform.',
  },
  '/cookie-policy': {
    title: 'Cookie Policy | LoyalCard',
    description: 'Which cookies and browser storage LoyalCard uses, and how you can control them.',
  },
  '/refund': {
    title: 'Refund Policy | LoyalCard',
    description: 'How refunds and cancellations work for LoyalCard paid plans.',
  },
  '/acceptable-use': {
    title: 'Acceptable Use Policy | LoyalCard',
    description: 'What is and is not allowed when using the LoyalCard platform.',
  },
}
