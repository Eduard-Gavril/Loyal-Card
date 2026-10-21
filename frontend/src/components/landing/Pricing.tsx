import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useL } from './shared'
import { IosIcon, Squircle } from './ios'

/** Plans, billing toggle and WhatsApp add-on. Shared by the landing and the sector pages. */
export default function Pricing() {
  const L = useL()
  const go = useNavigate()
  const [yearly, setYearly] = useState(true)

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

  return (
    <>
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
      </section>

    </>
  )
}
