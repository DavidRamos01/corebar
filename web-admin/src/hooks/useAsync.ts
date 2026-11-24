import { useState, useEffect, useCallback, useRef } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  getInitial?: () => T | null
): AsyncState<T> {
  const [data,    setData]    = useState<T | null>(() => getInitial?.() ?? null)
  const [loading, setLoading] = useState<boolean>(() => getInitial ? getInitial() === null : true)
  const [error,   setError]   = useState<string | null>(null)
  const counter   = useRef(0)
  const hasData   = useRef<boolean>(!!(getInitial?.()))

  const run = useCallback(async () => {
    const id = ++counter.current
    setError(null)
    if (!hasData.current) setLoading(true)
    try {
      const result = await fn()
      if (id === counter.current) {
        setData(result)
        hasData.current = true
        setLoading(false)
      }
    } catch (e: any) {
      if (id === counter.current) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Error desconocido')
        setLoading(false)
      }
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { run() }, [run])

  useEffect(() => {
    const handler = () => run()
    window.addEventListener('corebar:data', handler)
    return () => window.removeEventListener('corebar:data', handler)
  }, [run])

  return { data, loading, error, refetch: run }
}
