import type { CSSProperties } from 'react'
import { useCopy, useUi } from './shared'
import type { Example } from './content'
import './phone.css'

// Decorative QR (25x25). Finder squares plus a deterministic scatter; not scannable.
const N = 25
const QR_ON: [number, number][] = []
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const finder = (fx: number, fy: number) => {
      const dx = x - fx
      const dy = y - fy
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null
      return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
    }
    const f = finder(0, 0) ?? finder(N - 7, 0) ?? finder(0, N - 7)
    let on: boolean
    if (f !== null) on = f
    else if ((x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)) on = false
    else on = Math.abs((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) % 7 < 3
    if (on) QR_ON.push([x, y])
  }
}

export function Qr({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" aria-hidden="true">
      {QR_ON.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />
      ))}
    </svg>
  )
}

function Icon({ name }: { name: 'wallet' | 'scan' | 'user' | 'back' | 'check' | 'dots' }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'wallet' && (<><rect x="3" y="6" width="18" height="13" rx="3" {...p} /><path d="M3 10h18M16 14.5h2" {...p} /></>)}
      {name === 'scan' && <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 12h8" {...p} />}
      {name === 'user' && (<><circle cx="12" cy="8" r="3.5" {...p} /><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" {...p} /></>)}
      {name === 'back' && <path d="M15 5l-7 7 7 7" {...p} />}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 7.5" {...p} strokeWidth={2.6} />}
      {name === 'dots' && (<><circle cx="6" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="18" cy="12" r="1.4" fill="currentColor" /></>)}
    </svg>
  )
}

const pct = (e: Example) => `${(e.done / e.total) * 100}%`

function Status() {
  return (
    <div className="ph-status">
      <b>9:41</b>
      <span><i className="ph-sig" /><i className="ph-batt" /></span>
    </div>
  )
}

function Tab() {
  return (
    <div className="ph-tab">
      <span className="is-on"><Icon name="wallet" /></span>
      <span><Icon name="scan" /></span>
      <span><Icon name="user" /></span>
    </div>
  )
}

function FeaturedCard({ e, big }: { e: Example; big?: boolean }) {
  const u = useUi()
  const left = e.total - e.done
  return (
    <div className={`ph-fcard${big ? ' is-big' : ''}`}>
      <div className="ph-fc-top">
        <span className="ph-logo">{e.name[0]}</span>
        <div>
          <b>{e.name}</b>
          <small>{e.kind}</small>
        </div>
      </div>
      <div className="ph-count">
        <b>{e.done}</b>
        <span>/{e.total} {u.stampsWord}</span>
      </div>
      <div className="ph-bar"><i style={{ width: pct(e) }} /></div>
      <small>{left === 0 ? u.ready : u.toGo(left)}</small>
    </div>
  )
}

function WalletScreen({ ex }: { ex?: Example[] }) {
  const t = useCopy()
  const examples = ex ?? t.examples
  const u = useUi()
  return (
    <>
      <div className="ph-head">
        <div>
          <small>{u.greeting}</small>
          <h4>{u.wallet}</h4>
        </div>
        <span className="ph-plus">+</span>
      </div>
      <FeaturedCard e={examples[0]} />
      <p className="ph-label">{u.allCards}</p>
      <ul className="ph-list">
        {examples.map((x, i) => (
          <li key={x.name}>
            <span className={`ph-ico c${i}`}>{x.name[0]}</span>
            <div>
              <b>{x.name}</b>
              <small>{x.kind}</small>
            </div>
            {x.done === x.total ? <em className="ph-badge">{u.ready}</em> : <span className="ph-frac">{x.done}/{x.total}</span>}
          </li>
        ))}
      </ul>
      <Tab />
    </>
  )
}

function CardScreen({ ex }: { ex?: Example[] }) {
  const t = useCopy()
  const examples = ex ?? t.examples
  const u = useUi()
  const e = examples[0]
  return (
    <>
      <div className="ph-nav">
        <span><Icon name="back" /></span>
        <b>{e.name}</b>
        <span><Icon name="dots" /></span>
      </div>
      <FeaturedCard e={e} big />
      <div className="ph-stamps">
        {Array.from({ length: e.total }, (_, i) => (
          <span key={i} className={i < e.done ? 'on' : ''}>
            {i < e.done ? <Icon name="check" /> : i + 1}
          </span>
        ))}
      </div>
      <p className="ph-label">{u.activity}</p>
      <ul className="ph-act">
        <li>
          <span className="ph-ico c0"><Icon name="check" /></span>
          <div>
            <b>{u.stampAdded}</b>
            <small>{e.name} · {u.today}, 8:10</small>
          </div>
          <em>+1</em>
        </li>
        <li>
          <span className="ph-ico c1"><Icon name="check" /></span>
          <div>
            <b>{u.stampAdded}</b>
            <small>{examples[1].name} · 13:05</small>
          </div>
          <em>+1</em>
        </li>
      </ul>
    </>
  )
}

function QrScreen({ ex }: { ex?: Example[] }) {
  const t = useCopy()
  const u = useUi()
  const e = (ex ?? t.examples)[0]
  return (
    <>
      <div className="ph-nav">
        <span><Icon name="back" /></span>
        <b>{e.name}</b>
        <span><Icon name="dots" /></span>
      </div>
      <div className="ph-strip">
        <div>
          <b>{e.done}/{e.total} {u.stampsWord}</b>
          <small>{e.rule}</small>
        </div>
      </div>
      <div className="ph-qrbox"><Qr /></div>
      <p className="ph-hint">{u.showCode}</p>
      <div className="ph-btns">
        <span className="p">{u.redeem}</span>
        <span>{u.hide}</span>
      </div>
    </>
  )
}

export type ScreenKind = 'wallet' | 'card' | 'qr'

/** `examples` replaces the demo cards shown on the screens (e.g. with ones fitting a business sector). */
export function Phone({ kind, className = '', style, examples }: { kind: ScreenKind; className?: string; style?: CSSProperties; examples?: Example[] }) {
  return (
    <div className={`ph ${className}`} style={style} aria-hidden="true">
      <div className="ph-body">
        <span className="ph-island" />
        <div className="ph-screen">
          <Status />
          {kind === 'wallet' ? <WalletScreen ex={examples} /> : kind === 'card' ? <CardScreen ex={examples} /> : <QrScreen ex={examples} />}
          <span className="ph-home" />
        </div>
      </div>
    </div>
  )
}
