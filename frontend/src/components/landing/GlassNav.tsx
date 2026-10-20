import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { useCopy, useL } from './shared'
import { IosIcon, Squircle, type IconName } from './ios'

const LANGS = [
  ['it', 'IT'],
  ['en', 'EN'],
  ['ro', 'RO'],
] as const

export function LangSwitch() {
  const { language, setLanguage } = useClientStore()
  return (
    <div className="gn-lang" role="group" aria-label="Language">
      {LANGS.map(([code, label]) => (
        <button key={code} type="button" className={language === code ? 'is-on' : ''} onClick={() => setLanguage(code)}>
          {label}
        </button>
      ))}
    </div>
  )
}

export default function GlassNav() {
  const t = useCopy()
  const L = useL()
  const go = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const links: { href: string; label: string; icon: IconName; color: string }[] = [
    { href: '#how', label: t.nav.how, icon: 'phone', color: 'linear-gradient(160deg,#ffd166,#f5a623)' },
    { href: '#results', label: L('Risultati', 'Results', 'Rezultate'), icon: 'chart', color: 'linear-gradient(160deg,#ffb12a,#e5811a)' },
    { href: '#pricing', label: t.nav.pricing, icon: 'tag', color: 'linear-gradient(160deg,#ff9a3d,#e5671c)' },
    { href: '#faq', label: 'FAQ', icon: 'help', color: 'linear-gradient(160deg,#f0a35e,#c4601f)' },
    { href: '#contact', label: L('Contattaci', 'Contact Us', 'Contactează-ne'), icon: 'mail', color: 'linear-gradient(160deg,#f6c25a,#d99320)' },
  ]

  const close = () => setOpen(false)
  const goTo = (path: string) => {
    close()
    go(path)
  }

  return (
    <header className="ap-nav gn">
      <div className="ap-nav-in gn-in">
        <a href="#top" className="ap-logo" onClick={close}>
          <img src="/brand/logo-amber-tight.png" alt="" />
          LoyalCard
        </a>

        <nav className="gn-links" aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>

        <div className="gn-right">
          <LangSwitch />
          <button className="gn-profile" onClick={() => goTo('/dashboard')} aria-label={t.nav.dashboard}>
            <span className="gn-avatar"><IosIcon name="user" /></span>
            <span className="gn-profile-t">{t.nav.dashboard}</span>
          </button>
          <button className="gn-biz" onClick={() => goTo('/admin/login')}>{t.nav.admin}</button>
          <button className="gn-burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            <IosIcon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="gn-scrim" onClick={close} />
          <div className="gn-sheet" role="dialog" aria-label="Menu">
            <button className="gn-me" onClick={() => goTo('/dashboard')}>
              <span className="gn-avatar big"><IosIcon name="user" /></span>
              <span>
                <b>{t.nav.dashboard}</b>
                <small>{L('Le tue carte e i tuoi premi', 'Your cards and rewards', 'Cardurile și premiile tale')}</small>
              </span>
              <IosIcon name="chev" />
            </button>

            <ul className="gn-list">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={close}>
                    <Squircle color={l.color} size={34}><IosIcon name={l.icon} /></Squircle>
                    <span>{l.label}</span>
                    <IosIcon name="chev" />
                  </a>
                </li>
              ))}
            </ul>

            <ul className="gn-list">
              <li>
                <button onClick={() => goTo('/admin/login')}>
                  <Squircle color="linear-gradient(160deg,#ffc447,#e5811a)" size={34}><IosIcon name="store" /></Squircle>
                  <span>{t.nav.admin}</span>
                  <IosIcon name="chev" />
                </button>
              </li>
            </ul>

            <div className="gn-sheet-lang"><LangSwitch /></div>
          </div>
        </>
      )}
    </header>
  )
}
