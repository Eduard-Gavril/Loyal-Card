const RELOAD_FLAG = 'loyalcard-chunk-reload'

// A tab left open since before a deploy can try to load a JS chunk that no
// longer exists on the server (content-hashed filenames change every build).
// Reload once to pick up the current build; clearChunkReloadFlag() resets the
// guard once the app has mounted successfully, so a *later* deploy can still
// trigger one more automatic reload instead of being silently blocked forever.
export function reloadOnceForChunkError(): boolean {
  if (sessionStorage.getItem(RELOAD_FLAG)) return false
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
  return true
}

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(RELOAD_FLAG)
}
