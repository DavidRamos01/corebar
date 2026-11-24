import { useState, useEffect } from 'react'
import { getVersion } from '../api/version'

export function useDataVersion() {
  const [v, setV] = useState(getVersion)
  useEffect(() => {
    const h = () => setV(getVersion())
    window.addEventListener('corebar:data', h)
    return () => window.removeEventListener('corebar:data', h)
  }, [])
  return v
}
