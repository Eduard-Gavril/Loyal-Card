import { lazy, type ComponentType } from 'react'
import { reloadOnceForChunkError, clearChunkReloadFlag } from './chunkReload'

// Wraps React.lazy so a failed dynamic import (stale chunk hash after a
// deploy) reloads the page once to fetch the current build, instead of
// leaving the route stuck on a rejected Suspense boundary.
export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory()
      .then((mod) => {
        // A lazy chunk actually loaded, so the app is in a working state —
        // re-arm the one-shot guard for the *next* deploy. Clearing this on
        // every App mount instead (as a first pass did) cleared it mid-retry,
        // before the second attempt could see it, causing an infinite reload
        // loop instead of "retry once, then show a real error."
        clearChunkReloadFlag()
        return mod
      })
      .catch((error) => {
        if (reloadOnceForChunkError()) {
          // Reload is already in flight — never resolve, there's no component
          // to render in this tab anymore.
          return new Promise<{ default: T }>(() => {})
        }
        throw error
      })
  )
}
