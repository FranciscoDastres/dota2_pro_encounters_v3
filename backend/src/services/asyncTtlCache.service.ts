export class AsyncTtlCache<K, V> {
  private readonly values = new Map<K, { value: V; expiresAt: number }>()
  private readonly inflight = new Map<K, Promise<V>>()

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: K): V | undefined {
    const entry = this.values.get(key)
    if (!entry) return undefined

    if (entry.expiresAt <= Date.now()) {
      this.values.delete(key)
      return undefined
    }

    // Refresh insertion order so frequently used entries survive pruning.
    this.values.delete(key)
    this.values.set(key, entry)
    return entry.value
  }

  set(key: K, value: V, ttlMs = this.ttlMs): void {
    this.values.delete(key)
    this.values.set(key, { value, expiresAt: Date.now() + ttlMs })
    this.prune()
  }

  delete(key: K): void {
    this.values.delete(key)
    this.inflight.delete(key)
  }

  clear(): void {
    this.values.clear()
    this.inflight.clear()
  }

  getOrLoad(
    key: K,
    loader: () => Promise<V>,
    ttlMs: number | ((value: V) => number) = this.ttlMs,
  ): Promise<V> {
    const cached = this.get(key)
    if (cached !== undefined) return Promise.resolve(cached)

    const pending = this.inflight.get(key)
    if (pending) return pending

    const request = loader()
      .then((value) => {
        this.set(key, value, typeof ttlMs === 'function' ? ttlMs(value) : ttlMs)
        return value
      })
      .finally(() => {
        this.inflight.delete(key)
      })

    this.inflight.set(key, request)
    return request
  }

  private prune(): void {
    while (this.values.size > this.maxEntries) {
      const oldestKey = this.values.keys().next().value as K | undefined
      if (oldestKey === undefined) break
      this.values.delete(oldestKey)
    }
  }
}
