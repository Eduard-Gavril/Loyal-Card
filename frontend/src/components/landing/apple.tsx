import './apple.css'

export type Palette = 'amber' | 'emerald'

/** Root wrapper: applies the landing palette and base styles. */
export function ApShell({ palette, name, children }: { palette: Palette; name: string; children: React.ReactNode }) {
  return <div className={`ap pal-${palette} ${name}`}>{children}</div>
}
