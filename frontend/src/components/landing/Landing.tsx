import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCopy, useL, useLang, useT, useUi } from './shared'
import { ApShell } from './apple'
import { Phone, Qr } from './phone'
import { IosIcon, Squircle } from './ios'
import GlassNav from './GlassNav'
import Pricing from './Pricing'
import { SECTOR_IDS, sectors } from '@/lib/sectors'
import LiveWallpaper from './LiveWallpaper'
import './layoutA.css'
import './landing.css'

const num = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0

export default function Landing() {
  const t = useCopy()
  const u = useUi()
  const T = useT()
  const L = useL()
  const lang = useLang()
  const go = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const a = t.examples[0]
  const b = t.examples[1]

  const stats = [T.provenResults.stat1, T.provenResults.stat2, T.provenResults.stat3, T.provenResults.stat4]

  const faq = [
    {
      q: L("Cos'è una carta fedeltà digitale?", 'What is a digital loyalty card?', 'Ce este un card de fidelitate digital?'),
      a: L(
        "Una carta fedeltà digitale sostituisce quella fisica tradizionale: i clienti accumulano timbri o punti ad ogni acquisto e guadagnano premi. Con LoyalCard, la tua carta fedeltà è gratuita, sempre sul telefono e non richiede di scaricare un'app.",
        'A digital loyalty card replaces the traditional plastic card: customers collect stamps or points at every purchase and earn rewards. With LoyalCard, your free loyalty rewards card is always on your phone and requires no app download.',
        'Un card de fidelitate digital înlocuiește cardul plastic tradițional: clienții acumulează timbre sau puncte la fiecare achiziție și câștigă recompense. Cu LoyalCard, cardul tău de fidelitate este gratuit, mereu pe telefon și nu necesită descărcarea unei aplicații.',
      ),
    },
    { q: T.faq.q1, a: T.faq.a1 },
    { q: T.faq.q2, a: T.faq.a2 },
    { q: T.faq.q3, a: T.faq.a3 },
    { q: T.faq.q4, a: T.faq.a4 },
    { q: T.faq.q5, a: T.faq.a5 },
    { q: T.faq.q6, a: T.faq.a6 },
    { q: T.faq.q7, a: T.faq.a7 },
    { q: T.faq.q8, a: T.faq.a8 },
  ]

  const who = [
    { key: 'biz', icon: 'store' as const, data: T.forWho.businesses, cta: L('Inizia Ora', 'Start Now', 'Începe Acum'), to: '/contact' },
    { key: 'cust', icon: 'user' as const, data: T.forWho.customers, cta: L('Ottieni la Carta', 'Get Card', 'Obține Cardul'), to: '/dashboard' },
  ]

  return (
    <ApShell palette="amber" name="la la-glass">
      <LiveWallpaper />
      <span id="top" />
      <GlassNav />

      {/* ---------- Hero ---------- */}
      <header className="ap-sec la-hero">
        <p className="ap-eyebrow">{u.eyebrow}</p>
        <h1 className="ap-h1">
          {t.heroA}{' '}
          <br />
          <span>{t.heroB}</span>
        </h1>
        <p className="ap-sub la-sub">{t.sub}</p>
        <div className="ap-cta la-cta">
          <button className="ap-btn" onClick={() => go('/select-tenant')}>{t.cta}</button>
          <a className="ap-link" href="#how">{t.cta2}</a>
        </div>

        <div className="la-fan">
          <Phone kind="card" className="la-side" />
          <Phone kind="wallet" className="la-mid" />
          <Phone kind="qr" className="la-side" />
          <div className="lv-chip c1">
            <span className="lv-plus">+1</span>
            <span><b>{a.name}</b><small>{u.stampAdded}</small></span>
          </div>
          <div className="lv-chip c2">
            <span className="lv-gift"><IosIcon name="gift" /></span>
            <span><b>{b.name}</b><small>{u.ready}</small></span>
          </div>
        </div>
      </header>

      {/* ---------- How it works ---------- */}
      <section id="how" className="ap-sec la-steps">
        <ol>
          {t.steps.map((s, i) => (
            <li key={s.t}>
              <span>{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ap-sec la-bento">
        <article className="la-tile la-t1">
          <div className="la-txt"><h3>{u.tiles[0].t}</h3><p>{u.tiles[0].d}</p></div>
          <Phone kind="card" className="la-crop" />
        </article>
        <article className="la-tile la-t2">
          <div className="la-txt"><h3>{u.tiles[1].t}</h3><p>{u.tiles[1].d}</p></div>
          <div className="la-qr"><Qr /></div>
        </article>
        <article className="la-tile la-t3">
          <div className="la-txt"><h3>{u.tiles[2].t}</h3><p>{u.tiles[2].d}</p></div>
          <div className="la-stack">
            {t.examples.map((e, i) => (
              <div key={e.name} className={`la-mini m${i}`}><b>{e.name}</b><span>{e.done}/{e.total}</span></div>
            ))}
          </div>
        </article>
        <article className="la-tile la-t4">
          <div className="la-txt"><h3>{u.tiles[3].t}</h3><p>{u.tiles[3].d}</p></div>
          <div className="la-reward">
            <div className="la-dots">{Array.from({ length: b.total }, (_, i) => <i key={i} />)}</div>
            <span>{u.ready}</span>
          </div>
        </article>
      </section>

      {/* ---------- Examples ---------- */}
      <section id="examples" className="la-rail-wrap">
        <div className="ap-sec la-rail-head">
          <h2 className="ap-h2">{t.examplesTitle}</h2>
          <p className="ap-sub">{t.examplesSub}</p>
        </div>
        <div className="la-rail">
          {t.examples.map((e, i) => (
            <article key={e.name} className={`la-card k${i}`}>
              <div className="la-card-top"><b>{e.name}</b><em>{e.kind}</em></div>
              <p>{e.rule}</p>
              <div className="la-card-dots">
                {Array.from({ length: e.total }, (_, k) => <i key={k} className={k < e.done ? 'on' : ''} />)}
              </div>
              <small>{e.done === e.total ? u.ready : u.toGo(e.total - e.done)}</small>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Who is it for ---------- */}
      <section id="who" className="ap-sec gl-sec">
        <div className="gl-head">
          <h2 className="ap-h2">{T.forWho.title}</h2>
          <p className="ap-sub">{L('Soluzione completa per entrambe le parti', 'Complete solution for both sides', 'Soluție completă pentru ambele părți')}</p>
        </div>
        <div className="gl-who">
          {who.map((w) => (
            <article key={w.key} className="gl-glass gl-who-card">
              <Squircle color={w.key === 'biz' ? 'linear-gradient(160deg,#ffb12a,#e5671c)' : 'linear-gradient(160deg,#ffd166,#ffb12a)'} size={52}>
                <IosIcon name={w.icon} />
              </Squircle>
              <h3>{w.data.title}</h3>
              <p className="gl-who-sub">{w.data.subtitle}</p>
              <ul>
                {[w.data.benefit1, w.data.benefit2, w.data.benefit3, w.data.benefit4].map((x) => (
                  <li key={x}><i><IosIcon name="check" /></i>{x}</li>
                ))}
              </ul>
              <button className={w.key === 'biz' ? 'ap-btn' : 'ap-btn gl-btn-ghost'} onClick={() => go(w.to)}>{w.cta}</button>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Proven results ---------- */}
      <section id="results" className="ap-sec gl-sec">
        <div className="gl-head">
          <h2 className="ap-h2">{T.provenResults.title}</h2>
          <p className="ap-sub">{T.provenResults.subtitle}</p>
        </div>
        <div className="gl-stats">
          {stats.map((s) => {
            const before = num(s.before)
            const after = num(s.after)
            return (
              <article key={s.label} className="gl-glass gl-stat">
                <h3>{s.label}</h3>
                <div className="gl-stat-v">{s.value}</div>
                <div className="gl-bars">
                  <div>
                    <span>{T.provenResults.before}<b>{s.before}</b></span>
                    <i className="b0" style={{ width: `${(before / after) * 100}%` }} />
                  </div>
                  <div>
                    <span>{T.provenResults.after}<b>{s.after}</b></span>
                    <i className="b1" style={{ width: '100%' }} />
                  </div>
                </div>
                <a href={s.sourceLink} target="_blank" rel="noopener noreferrer">
                  {T.provenResults.sourceLabel} {s.source} <IosIcon name="ext" />
                </a>
              </article>
            )
          })}
        </div>
        <p className="gl-note">
          {L(
            'Queste statistiche sono basate su ricerche indipendenti nel settore dei programmi fedeltà',
            'These statistics are based on independent research in the loyalty programs industry',
            'Aceste statistici sunt bazate pe cercetări independente din industria programelor de loialitate',
          )}
        </p>
      </section>

      <Pricing />

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="ap-sec gl-sec gl-faq">
        <div className="gl-faq-head">
          <h2 className="ap-h2">FAQ</h2>
          <p className="ap-sub">{L('Le domande più frequenti', 'Frequently asked questions', 'Întrebări frecvente')}</p>
        </div>
        <ul className="gl-faq-list">
          {faq.map((f, i) => (
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

      {/* ---------- Contact ---------- */}
      <section id="contact" className="ap-sec gl-sec">
        <div className="gl-glass gl-contact">
          <div>
            <h2>{t.bizTitle}</h2>
            <p>{t.bizSub}</p>
          </div>
          <div className="gl-contact-btns">
            <button className="ap-btn" onClick={() => go('/contact')}>
              <IosIcon name="mail" /> {T.footerNav.contactUs}
            </button>
            <a className="ap-btn gl-btn-ghost" href="https://www.instagram.com/loyal.card/" target="_blank" rel="noopener noreferrer">
              <IosIcon name="insta" /> {T.footerNav.instagram}
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="ap-sec gl-footer">
        <div className="gl-footer-top">
          <span className="ap-logo"><img src="/brand/logo-amber-tight.png" alt="" />LoyalCard</span>
          <nav aria-label="Legal">
            <a href="/privacy">{T.footerNav.privacy}</a>
            <a href="/terms">{T.footerNav.terms}</a>
            <a href="/cookie-policy">{T.footerNav.cookies}</a>
            <a href="/refund">{T.footerNav.refund}</a>
            <a href="/acceptable-use">{T.footerNav.acceptableUse}</a>
            <a href="/contact">{T.footerNav.contactUs}</a>
          </nav>
        </div>
        <nav className="gl-sectors" aria-label="Sectors">
          {SECTOR_IDS.map((id) => (
            <a key={id} href={sectors[id][lang].path}>{sectors[id][lang].label}</a>
          ))}
        </nav>
        <p className="gl-copy">{T.footerNav.copyright}</p>
      </footer>
    </ApShell>
  )
}
