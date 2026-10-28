import type { ReactNode } from 'react'
import './ios.css'

export type IconName =
  | 'phone' | 'qr' | 'wallet' | 'gift' | 'check' | 'bell' | 'chev' | 'store' | 'star'
  | 'user' | 'menu' | 'close' | 'mail' | 'ext' | 'insta' | 'plus' | 'home' | 'help' | 'tag' | 'chart'
  | 'key' | 'download' | 'trash' | 'shield' | 'pencil' | 'alert' | 'back' | 'search' | 'pin' | 'copy' | 'info' | 'sparkle' | 'calendar'

export function IosIcon({ name }: { name: IconName }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {name === 'phone' && (<><rect x="7" y="2.5" width="10" height="19" rx="2.6" {...p} /><path d="M10.5 18.5h3" {...p} /></>)}
      {name === 'qr' && (<><rect x="4" y="4" width="6" height="6" rx="1.2" {...p} /><rect x="14" y="4" width="6" height="6" rx="1.2" {...p} /><rect x="4" y="14" width="6" height="6" rx="1.2" {...p} /><path d="M14 14h2.5v2.5M20 14v.01M14 20h.01M17 20h3v-3" {...p} /></>)}
      {name === 'wallet' && (<><rect x="3" y="6" width="18" height="13" rx="3" {...p} /><path d="M3 10h18M16 14.5h2" {...p} /></>)}
      {name === 'gift' && (<><rect x="4" y="9" width="16" height="11" rx="2" {...p} /><path d="M12 9v11M3.5 9h17M12 9c-2.5 0-4-1-4-2.5S9.5 4 11 5c.8.6 1 2 1 4zM12 9c2.5 0 4-1 4-2.5S14.5 4 13 5c-.8.6-1 2-1 4z" {...p} /></>)}
      {name === 'check' && <path d="M5 12.5l4.5 4.5L19 7.5" {...p} strokeWidth={2.4} />}
      {name === 'bell' && <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" {...p} />}
      {name === 'chev' && <path d="M9 5l7 7-7 7" {...p} strokeWidth={2.2} />}
      {name === 'store' && (<path d="M4 9l1.5-5h13L20 9M4 9v10h16V9M4 9c0 1.7 1.3 3 2.7 3S9.3 10.7 9.3 9c0 1.7 1.3 3 2.7 3s2.7-1.3 2.7-3c0 1.7 1.3 3 2.7 3S20 10.7 20 9" {...p} />)}
      {name === 'star' && <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" {...p} />}
      {name === 'user' && (<><circle cx="12" cy="8" r="3.6" {...p} /><path d="M5 20c.9-4 3.8-5.6 7-5.6s6.1 1.6 7 5.6" {...p} /></>)}
      {name === 'menu' && <path d="M4 7h16M4 12h16M4 17h16" {...p} strokeWidth={2.2} />}
      {name === 'close' && <path d="M6 6l12 12M18 6L6 18" {...p} strokeWidth={2.2} />}
      {name === 'mail' && (<><rect x="3" y="5.5" width="18" height="13" rx="3" {...p} /><path d="M4 8l8 5.5L20 8" {...p} /></>)}
      {name === 'ext' && <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" {...p} />}
      {name === 'insta' && (<><rect x="3.5" y="3.5" width="17" height="17" rx="5" {...p} /><circle cx="12" cy="12" r="4" {...p} /><circle cx="17" cy="7" r=".8" fill="currentColor" stroke="currentColor" /></>)}
      {name === 'plus' && <path d="M12 5v14M5 12h14" {...p} strokeWidth={2.2} />}
      {name === 'home' && <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" {...p} />}
      {name === 'help' && (<><circle cx="12" cy="12" r="8.5" {...p} /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5M12 16.6v.01" {...p} /></>)}
      {name === 'tag' && (<><path d="M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2a1.5 1.5 0 0 1 1.06.44l7.3 7.3a1.5 1.5 0 0 1 0 2.12l-6.5 6.5a1.5 1.5 0 0 1-2.12 0l-7.3-7.3a1.5 1.5 0 0 1-.44-1.06z" {...p} /><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" /></>)}
      {name === 'key' && <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" {...p} />}
      {name === 'download' && <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" {...p} />}
      {name === 'trash' && <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" {...p} />}
      {name === 'shield' && <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" {...p} />}
      {name === 'pencil' && <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" {...p} />}
      {name === 'alert' && <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" {...p} />}
      {name === 'back' && <path d="M15 5l-7 7 7 7" {...p} strokeWidth={2.2} />}
      {name === 'search' && <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" {...p} />}
      {name === 'pin' && (<><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" {...p} /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" {...p} /></>)}
      {name === 'copy' && <path d="M8 7h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2zM16 7V5a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2h2" {...p} />}
      {name === 'info' && (<><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 11v5M12 8v.01" {...p} /></>)}
      {name === 'calendar' && (<><rect x="3.5" y="5" width="17" height="15" rx="3" {...p} /><path d="M3.5 10h17M8 3v4M16 3v4" {...p} /><path d="M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01" {...p} strokeWidth={2.4} /></>)}
      {name === 'sparkle' && <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" {...p} />}
      {name === 'chart' && <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...p} />}
    </svg>
  )
}

/** iOS app-icon style rounded square. */
export function Squircle({ color, children, size = 40, className = '' }: { color: string; children: ReactNode; size?: number; className?: string }) {
  return (
    <span className={`ios-sq ${className}`} style={{ background: color, width: size, height: size, borderRadius: size * 0.27 }}>
      {children}
    </span>
  )
}
