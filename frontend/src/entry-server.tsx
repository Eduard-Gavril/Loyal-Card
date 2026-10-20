import './ssr-shims'
import { Suspense } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { useClientStore } from './store'
import { translations, type Language } from './lib/i18n'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import CookiePolicy from './pages/CookiePolicy'
import RefundPolicy from './pages/RefundPolicy'
import AcceptableUsePolicy from './pages/AcceptableUsePolicy'
import * as seo from './lib/seo'

// Build-time entry: draws the public pages to HTML. The browser then takes over (hydration) with the same components.
export { seo }

function page(path: string) {
  switch (path) {
    case '/': return <LandingPage routeLang="en" />
    case '/it': return <LandingPage routeLang="it" />
    case '/ro': return <LandingPage routeLang="ro" />
    case '/pricing': return <PricingPage />
    case '/contact': return <ContactPage />
    case '/privacy': return <PrivacyPolicy />
    case '/terms': return <TermsOfService />
    case '/cookie-policy': return <CookiePolicy />
    case '/refund': return <RefundPolicy />
    case '/acceptable-use': return <AcceptableUsePolicy />
    default: throw new Error(`No page registered for ${path}`)
  }
}

export function render(path: string, language: Language): string {
  // On the server zustand reads its *initial* state (React's server snapshot), not the current one, so set both.
  useClientStore.setState({ language, languageDetected: true })
  const initial = (useClientStore as unknown as { getInitialState?: () => object }).getInitialState?.()
  if (initial) Object.assign(initial, { language, languageDetected: true })
  // App wraps the routes in <Suspense>; React writes that boundary into the HTML, so the server must have it too or hydration fails.
  return renderToString(
    <StaticRouter location={path}>
      <Suspense fallback={null}>{page(path)}</Suspense>
    </StaticRouter>,
  )
}

/** Questions of the FAQ shown on the landing, for the FAQPage structured data of each language. */
export function faqEntries(language: Language): { q: string; a: string }[] {
  const f = translations[language].faq as Record<string, string>
  const out: { q: string; a: string }[] = []
  for (let i = 1; i <= 8; i++) if (f[`q${i}`] && f[`a${i}`]) out.push({ q: f[`q${i}`], a: f[`a${i}`] })
  return out
}
