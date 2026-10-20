import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApShell } from '@/components/landing/apple'
import LiveWallpaper from '@/components/landing/LiveWallpaper'
import { LangSwitch } from '@/components/landing/GlassNav'
import { IosIcon } from '@/components/landing/ios'
import { useCopy } from '@/components/landing/shared'
import './client.css'

interface Props {
  children: ReactNode
  /** Back button on the left. Omit for pages with nothing to go back to. */
  back?: { label: string; to: string }
  /** Show the "My area" shortcut. Turn off on the profile page itself. */
  profile?: boolean
  /** Narrow column, for pages that are a single card (wallet card, forms). */
  narrow?: boolean
}

/**
 * Common frame for the customer pages: live wallpaper, glass top bar (back, language, profile)
 * and a centred content column. Same look as the landing page.
 */
export default function ClientShell({ children, back, profile = true, narrow }: Props) {
  const navigate = useNavigate()
  const copy = useCopy()

  // dark address bar on phones while on these pages; put the original colour back on leave
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const previous = meta?.getAttribute('content') ?? null
    meta?.setAttribute('content', '#0b0907')
    return () => {
      if (meta && previous !== null) meta.setAttribute('content', previous)
    }
  }, [])

  return (
    <ApShell palette="amber" name="la la-glass cs">
      <LiveWallpaper />

      <header className="ap-nav">
        <div className="ap-nav-in">
          {back ? (
            <button className="cs-back" onClick={() => navigate(back.to)}>
              <IosIcon name="back" />
              <span>{back.label}</span>
            </button>
          ) : (
            <span />
          )}
          <div className="cs-right">
            <LangSwitch />
            {profile && (
              <button className="gn-profile" onClick={() => navigate('/dashboard')} aria-label={copy.nav.dashboard}>
                <span className="gn-avatar"><IosIcon name="user" /></span>
                <span className="gn-profile-t">{copy.nav.dashboard}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`cs-main${narrow ? ' narrow' : ''}`}>{children}</main>
    </ApShell>
  )
}
