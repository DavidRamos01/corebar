import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      nav('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #f0f2ff 0%, #eef1f8 45%, #e6ecf7 100%)',
        '--c-surface':  '#ffffff',
        '--c-surface2': '#f5f7fd',
        '--c-surface3': '#edf0fb',
        '--c-rim':      '#e2e7f5',
        '--c-rim2':     '#cdd4ee',
        '--c-ink':      '#0f1349',
        '--c-muted':    '#6b7a99',
        '--c-faint':    '#9faac2',
      } as React.CSSProperties}
    >

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .45, ease: [.22, 1, .36, 1] }}
        className="relative w-full max-w-[440px]"
      >
        {/* Single card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .12, duration: .4, ease: [.22, 1, .36, 1] }}
          className="bg-surface border border-rim rounded-2xl shadow-card-md p-8"
        >
          {/* Logo + title */}
          <div className="flex flex-col items-center mb-7">
            <motion.img
              src="/logo.png"
              alt="CoreBar"
              initial={{ scale: .85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: .2, duration: .4, ease: [.22, 1, .36, 1] }}
              className="w-[110px] h-[110px] object-contain drop-shadow-md mb-4"
            />
            <h1 className="text-[24px] font-bold text-ink tracking-tight leading-none">CoreBar</h1>
            <p className="text-[12px] text-faint mt-1.5 tracking-wide">Panel de administración</p>
          </div>

          {/* Divider */}
          <div className="border-t border-rim mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-500/8 border border-red-500/20 rounded-xl text-danger text-sm overflow-hidden"
              >
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest">
                Usuario
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input w-full h-11 text-sm"
                placeholder="admin"
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-widest">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full h-11 text-sm pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors p-0.5"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-11 justify-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Verificando…
                </span>
              ) : 'Acceder'}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-[11px] text-faint/70 mt-5 tracking-wide">
          © 2025 CoreBar · Todos los derechos reservados
        </p>
      </motion.div>
    </div>
  )
}
