import { useEffect, useState } from 'react'
import { useClientStore } from '@/store'
import { LANDING_META, LANDING_PATH, SITE_URL, type SeoLang } from '@/lib/seo'
import Landing from '@/components/landing/Landing'

// Page-level concerns only: SEO tags and the browser chrome colour.
// The page itself lives in components/landing; the tags per language live in lib/seo.ts.

// Same as <meta name="theme-color"> in index.html (#8b5cf6) for every other page.
const LANDING_THEME_COLOR = '#0b0907'

/**
 * `routeLang` is the language of the URL the page is served from: '/' (en), '/it' or '/ro'.
 * Visiting /it or /ro selects that language; '/' keeps the visitor's own language.
 */
export default function LandingPage({ routeLang = 'en' }: { routeLang?: SeoLang }) {
  // Set before the first render, so the page (and the HTML generated at build time) is in the URL's language.
  useState(() => {
    // Only when it actually differs: main.tsx already does this before the first render, and a no-op update here
    // would notify subscribers in the middle of hydration.
    if (routeLang !== 'en' && useClientStore.getState().language !== routeLang) {
      useClientStore.setState({ language: routeLang, languageDetected: true })
    }
  })
  const { language } = useClientStore()

  // Update meta tags based on language
  useEffect(() => {
    const meta = LANDING_META[language as SeoLang] || LANDING_META.en

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

    // The canonical address belongs to the URL, not to the visitor: '/' stays '/' even when shown in Italian.
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = SITE_URL + LANDING_PATH[routeLang]

    // Update html lang attribute
    document.documentElement.lang = language
  }, [language, routeLang])

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
