import { useEffect } from 'react'
import LiveWallpaper from '@/components/landing/LiveWallpaper'
import './adminTheme.css'

/**
 * Drop-in replacement for StaticBackground on the admin pages: the same live amber wallpaper as the
 * landing, and it switches on the amber theme (adminTheme.css) for the whole document while mounted.
 * Pages keep their own markup and logic; only colours and background change.
 */
export default function AdminBackdrop() {
  useEffect(() => {
    document.documentElement.classList.add('adm')
    const meta = document.querySelector('meta[name="theme-color"]')
    const previous = meta?.getAttribute('content') ?? null
    meta?.setAttribute('content', '#0b0907')
    return () => {
      document.documentElement.classList.remove('adm')
      if (meta && previous !== null) meta.setAttribute('content', previous)
    }
  }, [])
  return <LiveWallpaper />
}
