const store = new Map<string, { data: unknown; ts: number }>()

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const entry = store.get(key)
  if (entry && Date.now() - entry.ts < ttlMs) return Promise.resolve(entry.data as T)
  return fn().then(data => { store.set(key, { data, ts: Date.now() }); return data })
}

export function readSync<T>(key: string, ttlMs: number): T | null {
  const entry = store.get(key)
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data as T
  return null
}

export function invalidate(...keys: string[]) {
  keys.forEach(k => store.delete(k))
}

export function invalidateAll() {
  store.clear()
}
