import { useEffect, useState } from 'react'
import './liveWallpaper.css'

/**
 * Slowly drifting colour fields behind the page.
 *
 * Cost control:
 *  - only transform is animated (compositor only, no layout or paint per frame)
 *  - the blobs are soft radial gradients, so no blur filter is needed
 *  - animation is paused while the tab is hidden
 *  - no animation at all for prefers-reduced-motion (CSS)
 *  - once the page has settled, frame times are sampled for ~1.5s; if the median frame takes
 *    longer than ~24ms (under 42 fps) the animation is switched off for the rest of the visit.
 *    The median ignores the few long frames that happen while a page is still loading.
 */
export default function LiveWallpaper() {
  const [lite, setLite] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let last = 0
    let start = 0
    const deltas: number[] = []
    const tick = (now: number) => {
      if (!start) start = now
      if (last) deltas.push(now - last)
      last = now
      if (now - start >= 1500) {
        deltas.sort((a, b) => a - b)
        const median = deltas[Math.floor(deltas.length / 2)] ?? 0
        if (median > 24) setLite(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, 1800)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div className={`lw${lite ? ' is-lite' : ''}${hidden ? ' is-hidden' : ''}`} aria-hidden="true">
      <i className="b1" />
      <i className="b2" />
    </div>
  )
}
