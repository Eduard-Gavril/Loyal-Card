import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { PLAN_NAMES, type PlanUsage } from '@/lib/plan'

type Lang = 'en' | 'it' | 'ro'

const TEXT: Record<Lang, {
  title: string; plan: string; stores: string; clients: string; rules: string; staff: string
  unlimited: string; near: string; reached: string; upgrade: string; downgraded: (p: string) => string
}> = {
  en: {
    title: 'Your plan', plan: 'Plan', stores: 'Locations', clients: 'Active clients (30 days)', rules: 'Active loyalty rules', staff: 'Staff accounts',
    unlimited: 'Unlimited', near: 'You are close to a limit of your plan.', reached: 'You reached a limit of your plan: new items are blocked until you upgrade.',
    upgrade: 'Upgrade plan', downgraded: (p) => `Your subscription is not active: limits of the ${p} plan apply.`,
  },
  it: {
    title: 'Il tuo piano', plan: 'Piano', stores: 'Sedi', clients: 'Clienti attivi (30 giorni)', rules: 'Regole fedeltà attive', staff: 'Account staff',
    unlimited: 'Illimitati', near: 'Sei vicino a un limite del tuo piano.', reached: 'Hai raggiunto un limite del tuo piano: i nuovi elementi sono bloccati finché non passi a un piano superiore.',
    upgrade: 'Passa a un piano superiore', downgraded: (p) => `L'abbonamento non è attivo: valgono i limiti del piano ${p}.`,
  },
  ro: {
    title: 'Planul tău', plan: 'Plan', stores: 'Locații', clients: 'Clienți activi (30 de zile)', rules: 'Reguli de fidelitate active', staff: 'Conturi staff',
    unlimited: 'Nelimitat', near: 'Ești aproape de o limită a planului tău.', reached: 'Ai atins o limită a planului: elementele noi sunt blocate până când treci la un plan superior.',
    upgrade: 'Treci la un plan superior', downgraded: (p) => `Abonamentul nu este activ: se aplică limitele planului ${p}.`,
  },
}

function Meter({ label, used, max, unlimited }: { label: string; used: number; max: number | null; unlimited: string }) {
  const ratio = max === null ? 0 : max === 0 ? 1 : Math.min(used / max, 1)
  const color = ratio >= 1 ? 'bg-red-400' : ratio >= 0.8 ? 'bg-amber-400' : 'bg-primary-400'
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1.5">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-semibold">
          {used} / {max === null ? unlimited : max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: max === null ? '0%' : `${ratio * 100}%` }} />
      </div>
    </div>
  )
}

/** The business's plan with usage meters and a warning at 80% / 100% of a limit. */
export default function PlanCard({ usage }: { usage: PlanUsage }) {
  const { language } = useClientStore()
  const navigate = useNavigate()
  const t = TEXT[language === 'it' || language === 'ro' ? language : 'en']
  const rows: { label: string; used: number; max: number | null }[] = [
    { label: t.stores, used: usage.usage.stores, max: usage.limits.stores },
    { label: t.clients, used: usage.usage.active_clients, max: usage.limits.active_clients },
    { label: t.rules, used: usage.usage.rules, max: usage.limits.rules },
    { label: t.staff, used: usage.usage.staff, max: usage.limits.staff },
  ]
  const ratios = rows.map((r) => (r.max === null ? 0 : r.max === 0 ? (r.used > 0 ? 1 : 0) : r.used / r.max))
  const worst = Math.max(0, ...ratios)
  const full = rows.some((r) => r.max !== null && r.max > 0 && r.used >= r.max)
  const isTop = usage.effective_plan === 'enterprise'

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-8 border border-white/20">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{t.title}</h2>
        <span className="px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/40 text-primary-200 text-sm font-semibold">
          {PLAN_NAMES[usage.effective_plan]}
        </span>
      </div>

      {usage.effective_plan !== usage.plan && (
        <p className="mb-4 text-sm text-amber-200">{t.downgraded(PLAN_NAMES[usage.effective_plan])}</p>
      )}

      <div className="space-y-4">
        {rows.map((r) => (
          <Meter key={r.label} label={r.label} used={r.used} max={r.max} unlimited={t.unlimited} />
        ))}
      </div>

      {worst >= 0.8 && (
        <p className={`mt-5 text-sm ${full ? 'text-red-300' : 'text-amber-200'}`}>{full ? t.reached : t.near}</p>
      )}

      {!isTop && (
        <button
          onClick={() => navigate('/contact')}
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
        >
          {t.upgrade}
        </button>
      )}
    </div>
  )
}
