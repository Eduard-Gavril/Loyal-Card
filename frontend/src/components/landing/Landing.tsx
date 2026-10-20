import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCopy, useL, useT, useUi } from './shared'
import { ApShell } from './apple'
import { Phone, Qr } from './phone'
import { IosIcon, Squircle } from './ios'
import GlassNav from './GlassNav'
import LiveWallpaper from './LiveWallpaper'
import './layoutA.css'
import './landing.css'

const num = (s: string) => Number(s.replace(/[^0-9.]/g, '')) || 0

export default function Landing() {
  const t = useCopy()
  const u = useUi()
  const T = useT()
  const L = useL()
  const go = useNavigate()
  const [yearly, setYearly] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const a = t.examples[0]
  const b = t.examples[1]

  const plans = [
    {
      id: 'starter', name: 'Starter', price: 0, yearlyPrice: 0,
      badge: L('Gratis', 'Free', 'Gratuit'),
      desc: L('Perfetto per iniziare', 'Perfect to get started', 'Perfect pentru a începe'),
      feats: [
        L('1 sede', '1 location', '1 locație'),
        L('50 clienti attivi/mese', '50 active clients/month', '50 clienți activi/lună'),
        L('1 regola fedeltà', '1 loyalty rule', '1 regulă loyalty'),
        L('Branding LoyalCard', 'LoyalCard branding', 'Branding LoyalCard'),
      ],
      cta: L('Inizia Gratis', 'Start Free', 'Începe Gratuit'),
    },
    {
      id: 'business', name: 'Business', price: 30, yearlyPrice: 288, popular: true,
      badge: L('Più Popolare', 'Most Popular', 'Cel mai popular'),
      desc: L('Per piccole e medie imprese', 'For small and medium businesses', 'Pentru afaceri mici și medii'),
      feats: [
        L('2 sedi', '2 locations', '2 locații'),
        L('100 clienti attivi/mese', '100 active clients/month', '100 clienți activi/lună'),
        L('Regole fedeltà illimitate', 'Unlimited loyalty rules', 'Reguli loyalty nelimitate'),
        L('Gestione prodotti', 'Product management', 'Product management'),
        L('Analytics + Export Excel', 'Analytics + Excel export', 'Analytics + Export Excel'),
        L('White-label (logo proprio)', 'White-label (your logo)', 'White-label (logo propriu)'),
      ],
      cta: L('Scegli Business', 'Choose Business', 'Alege Business'),
    },
    {
      id: 'pro', name: 'Professional', price: 60, yearlyPrice: 576,
      badge: L('Avanzato', 'Advanced', 'Avansat'),
      desc: L('Per catene e franchising', 'For chains and franchises', 'Pentru catene și francize'),
      feats: [
        L('3 sedi', '3 locations', '3 locații'),
        L('250 clienti attivi/mese', '250 active clients/month', '250 clienți activi/lună'),
        L('Tutto in Business +', 'Everything in Business +', 'Tot din Business +'),
        L('Premi multi-livello', 'Multi-level rewards', 'Multi-level rewards'),
        L('Analytics avanzate', 'Advanced analytics', 'Analytics avansate'),
        L('Supporto prioritario', 'Priority support', 'Support prioritar'),
      ],
      cta: L('Scegli Professional', 'Choose Professional', 'Alege Professional'),
    },
    {
      id: 'ent', name: 'Enterprise', price: 149, yearlyPrice: 1430,
      badge: 'Premium',
      desc: L('Per grandi aziende', 'For large-scale businesses', 'Pentru afaceri la scară mare'),
      feats: [
        L('Sedi illimitate', 'Unlimited locations', 'Locații nelimitate'),
        L('Clienti illimitati', 'Unlimited clients', 'Clienți nelimitați'),
        L('Account staff illimitati', 'Unlimited staff accounts', 'Conturi staff nelimitate'),
        L('Tutto in Professional +', 'Everything in Professional +', 'Tot din Professional +'),
        L('Integrazioni personalizzate', 'Custom integrations', 'Integrări personalizate'),
        L('SLA 99.9%', 'SLA 99.9%', 'SLA 99.9%'),
      ],
      cta: L('Contattaci', 'Contact Us', 'Contactează-ne'),
    },
  ]

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

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="ap-sec gl-sec">
        <div className="gl-head">
          <h2 className="ap-h2">{L('Piani Personalizzati Per La Tua Attività', 'Custom Plans For Your Business', 'Planuri Personalizate Pentru Afacerea Ta')}</h2>
          <p className="ap-sub">
            {L(
              'Dal gratuito per iniziare, alle soluzioni enterprise per grandi aziende. Scegli il piano perfetto per le tue esigenze.',
              'From free to get started, to enterprise solutions for large businesses. Choose the perfect plan for your needs.',
              'De la gratuit pentru a începe, până la soluții enterprise pentru afaceri mari. Alege planul perfect pentru nevoile tale.',
            )}
          </p>
          <div className="gl-toggle" role="group">
            <button className={!yearly ? 'is-on' : ''} onClick={() => setYearly(false)}>{L('Mensile', 'Monthly', 'Lunar')}</button>
            <button className={yearly ? 'is-on' : ''} onClick={() => setYearly(true)}>
              {L('Annuale', 'Yearly', 'Anual')}
              <em>{L('Risparmia 20%', 'Save 20%', 'Economisești 20%')}</em>
            </button>
          </div>
        </div>

        <div className="gl-plans">
          {plans.map((p) => {
            const price = yearly ? Math.round(p.yearlyPrice / 12) : p.price
            return (
              <article key={p.id} className={`gl-glass gl-plan${p.popular ? ' is-pop' : ''}`}>
                <span className="gl-badge">{p.badge}</span>
                <h3>{p.name}</h3>
                <p className="gl-plan-d">{p.desc}</p>
                <div className="gl-price">
                  <b>€{price}</b>
                  {p.price > 0 && <span>{L('/mese', '/mo', '/lună')}</span>}
                </div>
                <small className="gl-bill">
                  {yearly && p.price > 0 ? `€${p.yearlyPrice} ${L('fatturato annualmente', 'billed annually', 'facturat anual')}` : ' '}
                </small>
                <ul>
                  {p.feats.map((f) => (
                    <li key={f}><i><IosIcon name="check" /></i>{f}</li>
                  ))}
                </ul>
                <button className={p.popular ? 'ap-btn' : 'ap-btn gl-btn-ghost'} onClick={() => go('/contact')}>{p.cta}</button>
              </article>
            )
          })}
        </div>

        <div className="gl-glass gl-addon">
          <Squircle color="linear-gradient(160deg,#ffc447,#e5811a)" size={46}><IosIcon name="bell" /></Squircle>
          <div>
            <b>{L('Notifiche WhatsApp', 'WhatsApp Notifications', 'Notificări WhatsApp')} <em>+€9{L('/mese', '/mo', '/lună')}</em></b>
            <p>
              {L(
                'Invia notifiche automatiche ai clienti tramite WhatsApp. Aumenta il coinvolgimento e la fidelizzazione con messaggi personalizzati.',
                'Send automated notifications to customers via WhatsApp. Increase engagement and retention with personalized messages.',
                'Trimite notificări automate clienților prin WhatsApp. Aumenta engagement-ul și fidelizarea cu mesaje personalizate.',
              )}
            </p>
          </div>
          <button className="ap-btn gl-btn-ghost" onClick={() => go('/contact')}>{L('Richiedi Info', 'Request Info', 'Solicită Info')}</button>
        </div>

        <div className="gl-plans-foot">
          <a className="ap-link" href="/pricing" onClick={(e) => { e.preventDefault(); go('/pricing') }}>
            {L('Vedi Tutti i Piani', 'View All Plans', 'Vezi Toate Planurile')}
          </a>
        </div>
      </section>

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
        <p className="gl-copy">{T.footerNav.copyright}</p>
      </footer>
    </ApShell>
  )
}
