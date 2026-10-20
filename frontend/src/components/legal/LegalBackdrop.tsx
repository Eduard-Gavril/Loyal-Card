import { useEffect } from 'react'
import LiveWallpaper from '@/components/landing/LiveWallpaper'
import './legalTheme.css'

/**
 * Amber look for the document pages (legal policies, contact): same live wallpaper as the landing,
 * plus a dark theme for their light markup. Active only while mounted (html.doc); the texts are untouched.
 */
export default function LegalBackdrop() {
  useEffect(() => {
    document.documentElement.classList.add('doc')
    const meta = document.querySelector('meta[name="theme-color"]')
    const previous = meta?.getAttribute('content') ?? null
    meta?.setAttribute('content', '#0b0907')
    return () => {
      document.documentElement.classList.remove('doc')
      if (meta && previous !== null) meta.setAttribute('content', previous)
    }
  }, [])
  return <LiveWallpaper />
}
