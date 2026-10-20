import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { LANDING_PATH, SITE_URL, type SeoLang } from '@/lib/seo'
import { SECTOR_IDS, sectors, sectorUi, type SectorId } from '@/lib/sectors'
import { ApShell } from '@/components/landing/apple'
import GlassNav, { type NavLink } from '@/components/landing/GlassNav'
import LiveWallpaper from '@/components/landing/LiveWallpaper'
import { Phone } from '@/components/landing/phone'
import { IosIcon, Squircle, type IconName } from '@/components/landing/ios'
import '@/components/landing/layoutA.css'
import '@/components/landing/landing.css'
import '@/components/landing/sector.css'

const LANDING_THEME_COLOR = '#0b0907'
const BENEFIT_ICONS: IconName[] = ['qr', 'gift', 'chart']
const BENEFIT_COLORS = [
  'linear-gradient(160deg,#ffd166,#f5a623)',
  'linear-gradient(160deg,#ffb12a,#e5811a)',
  'linear-gradient(160deg,#ff9a3d,#e5671c)',
]

/**
 * A landing page for one type of business, in the language of its URL.
 * Same look as the main landing; the text is specific to the sector (see lib/sectors.ts).
 */
export default function SectorPage({ sector, routeLang }: { sector: SectorId; routeLang: SeoLang }) {
  // Same as LandingPage: the language of the address is chosen before the first render.
  useState(() => {
    if (useClientStore.getState().language !== routeLang) {
      useClientStore.setState({ language: routeLang, languageDetected: true })
    }
  })
  const { language } = useClientStore()
  const lang: SeoLang = language === 'it' || language === 'ro' ? language : 'en'
  const c = sectors[sector][lang]
  const u = sectorUi[lang]
  const go = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // The tags belong to the address (routeLang), the visible text follows the language switch.
  useEffect(() => {
    const meta = sectors[sector][routeLang]
    document.title = meta.title
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('description', meta.description)
    setMeta('keywords', meta.keywords)
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = SITE_URL + meta.path
    document.documentElement.lang = lang
  }, [sector, routeLang, lang])

  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    const previous = themeMeta?.getAttribute('content') ?? null
    themeMeta?.setAttribute('content', LANDING_THEME_COLOR)
    return () => {
      if (themeMeta && previous !== null) themeMeta.setAttribute('content', previous)
    }
  }, [])

  const nav: NavLink[] = [
    { href: '#how', label: u.navHow, icon: 'phone', color: 'linear-gradient(160deg,#ffd166,#f5a623)' },
    { href: '#faq', label: u.navFaq, icon: 'help', color: 'linear-gradient(160deg,#f0a35e,#c4601f)' },
    { href: '/pricing', label: u.navPricing, icon: 'tag', color: 'linear-gradient(160deg,#ff9a3d,#e5671c)' },
    { href: '/contact', label: u.navContact, icon: 'mail', color: 'linear-gradient(160deg,#f6c25a,#d99320)' },
  ]

  return (
    <ApShell palette="amber" name="la la-glass">
      <LiveWallpaper />
      <span id="top" />
      <GlassNav links={nav} home={LANDING_PATH[lang]} />

      <header className="ap-sec la-hero">
        <p className="ap-eyebrow">{c.eyebrow}</p>
        <h1 className="ap-h1">
          {c.h1a}{' '}
          <br />
          <span>{c.h1b}</span>
        </h1>
        <p className="ap-sub la-sub">{c.sub}</p>
        <div className="ap-cta la-cta">
          <button className="ap-btn" onClick={() => go('/contact')}>{u.ctaBtn}</button>
          <a className="ap-link" href="#how">{u.navHow}</a>
        </div>
        <div className="la-fan">
          <Phone kind="card" className="la-side" />
          <Phone kind="wallet" className="la-mid" />
          <Phone kind="qr" className="la-side" />
        </div>
      </header>

      <section className="ap-sec gl-sec sc-benefits">
        <div className="gl-head">
          <h2 className="ap-h2">{u.benefitsTitle}</h2>
        </div>
        <div className="sc-grid">
          {c.benefits.map((b, i) => (
            <article key={b.t} className="gl-glass sc-benefit">
              <Squircle color={BENEFIT_COLORS[i]} size={46}><IosIcon name={BENEFIT_ICONS[i]} /></Squircle>
              <h3>{b.t}</h3>
              <p>{b.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="ap-sec la-steps gl-sec">
        <div className="gl-head">
          <h2 className="ap-h2">{u.stepsTitle}</h2>
        </div>
        <ol>
          {u.steps.map((s, i) => (
            <li key={s.t}>
              <span>{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ap-sec gl-sec sc-examples">
        <div className="gl-head">
          <h2 className="ap-h2">{u.examplesTitle}</h2>
          <p className="ap-sub">{u.examplesSub}</p>
        </div>
        <div className="sc-cards">
          {c.examples.map((e, i) => (
            <article key={e.name} className={`la-card k${i % 2} sc-card`}>
              <div className="la-card-top"><b>{e.name}</b><em>{e.kind}</em></div>
              <p>{e.rule}</p>
              <div className="la-card-dots">
                {Array.from({ length: e.total }, (_, k) => <i key={k} className={k < e.done ? 'on' : ''} />)}
              </div>
              <small>{u.toGo(e.total - e.done)}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="ap-sec gl-sec gl-faq">
        <div className="gl-faq-head">
          <h2 className="ap-h2">FAQ</h2>
          <p className="ap-sub">{u.faqSub}</p>
        </div>
        <ul className="gl-faq-list">
          {c.faq.map((f, i) => (
            <li key={f.q} className={`gl-glass${openFaq === i ? ' is-open' : ''}`}>
              <button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <i><IosIcon name="plus" /></i>
              </button>
              <div className="gl-faq-a"><div><p>{f.a}</p></div></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="ap-sec gl-sec">
        <div className="gl-glass gl-contact">
          <div>
            <h2>{u.ctaTitle}</h2>
            <p>{u.ctaSub}</p>
          </div>
          <div className="gl-contact-btns">
            <button className="ap-btn" onClick={() => go('/contact')}>{u.ctaBtn}</button>
            <a className="ap-btn gl-btn-ghost" href="/pricing" onClick={(e) => { e.preventDefault(); go('/pricing') }}>{u.seePricing}</a>
          </div>
        </div>
      </section>

      <section className="ap-sec sc-others">
        <h2>{u.othersTitle}</h2>
        <ul>
          {SECTOR_IDS.filter((id) => id !== sector).map((id) => (
            <li key={id}><a href={sectors[id][lang].path}>{sectors[id][lang].label}</a></li>
          ))}
          <li><a href={LANDING_PATH[lang]}>LoyalCard</a></li>
        </ul>
      </section>

      <footer className="ap-sec gl-footer">
        <div className="gl-footer-top">
          <a className="ap-logo" href={LANDING_PATH[lang]}><img src="/brand/logo-amber-tight.png" alt="" />LoyalCard</a>
          <nav aria-label="Legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/cookie-policy">Cookies</a>
            <a href="/refund">Refund</a>
            <a href="/acceptable-use">Acceptable use</a>
            <a href="/contact">{u.navContact}</a>
          </nav>
        </div>
      </footer>
    </ApShell>
  )
}
