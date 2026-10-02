import { lazy, type ComponentType } from 'react'
import { reloadOnceForChunkError } from './chunkReload'

// Wraps React.lazy so a failed dynamic import (stale chunk hash after a
// deploy) reloads the page once to fetch the current build, instead of
// leaving the route stuck on a rejected Suspense boundary.
export function lazyWithReload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((error) => {
      if (reloadOnceForChunkError()) {
        // Reload is already in flight — never resolve, there's no component
        // to render in this tab anymore.
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    })
  )
}
