// Build-time only (scripts/prerender.mjs). Pages are drawn in Node, where there is no browser storage:
// give the store an in-memory one so it never tries to touch the network or the disk.
const memory = new Map<string, string>()
const g = globalThis as unknown as { localStorage?: Storage }
if (!g.localStorage) {
  g.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
    removeItem: (k: string) => void memory.delete(k),
    clear: () => memory.clear(),
    key: (i: number) => [...memory.keys()][i] ?? null,
    get length() {
      return memory.size
    },
  } as Storage
}
// The store looks up the visitor's country over the network when no language is saved; never do that at build time.
globalThis.fetch = (() => Promise.reject(new Error('network disabled during prerender'))) as typeof fetch
export {}
