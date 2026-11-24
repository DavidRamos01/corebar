import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, preloadAll } from '../api'
import type { AuthUser } from '../api/types'

const PRELOAD_TIMEOUT = 10_000 // 10s max — never block forever

const preloadSafe = () =>
  Promise.race([
    preloadAll(),
    new Promise<void>(resolve => setTimeout(resolve, PRELOAD_TIMEOUT)),
  ])

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isPreloading: boolean
  isReloading: boolean   // true = F5 reload preload; false = post-login preload
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,         setUser]         = useState<AuthUser | null>(null)
  const [token,        setToken]        = useState<string | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)
  const [isPreloading, setIsPreloading] = useState(false)
  const [isReloading,  setIsReloading]  = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('cb_token')
    const savedUser  = localStorage.getItem('cb_user')
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        if (parsed && typeof parsed === 'object') {
          setToken(savedToken)
          setUser(parsed)
          setIsPreloading(true)
          setIsReloading(true)   // ← reload scenario
          preloadSafe().finally(() => {
            setIsPreloading(false)
            setIsReloading(false)
          })
        } else {
          localStorage.removeItem('cb_token')
          localStorage.removeItem('cb_user')
        }
      } catch {
        localStorage.removeItem('cb_token')
        localStorage.removeItem('cb_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const data = await apiLogin(username, password)
    localStorage.setItem('cb_token', data.token)
    localStorage.setItem('cb_user', JSON.stringify(data.profile))
    setToken(data.token)
    setUser(data.profile)
    setIsPreloading(true)
    // isReloading stays false — this is post-login, show full LoadingScreen
    await preloadSafe()
    setIsPreloading(false)
  }

  const logout = () => {
    localStorage.removeItem('cb_token')
    localStorage.removeItem('cb_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token,
      isLoading, isPreloading, isReloading,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
