import { useState } from 'react'
import { login, setToken } from '../api'
import Icon from './Icon'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(username, password)
      const tok = data?.accessToken
      if (!tok) throw new Error('El servidor no devolvió token.')
      if (data.usuario?.rol !== 'COCINERO') {
        throw new Error('Acceso denegado. Solo usuarios con rol Cocinero pueden entrar aquí.')
      }
      setToken(tok)
      onLogin(tok)
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-rail" aria-hidden="true" />
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-head">
          <div className="login-icon"><img src="/logo.png" alt="Corebar" /></div>
          <div>
            <h1 className="login-title">Corebar · Cocina</h1>
            <p className="login-sub">Pase de cocina</p>
          </div>
        </div>

        <div className="login-meta">
          <span>Acceso</span>
          <span>Solo personal de cocina</span>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <label className="field-label" htmlFor="username">Usuario</label>
        <div className="field-box">
          <Icon name="user" size={18} />
          <input
            id="username"
            className="field-input"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <label className="field-label" htmlFor="password">Contraseña</label>
        <div className="field-box">
          <Icon name="lock" size={18} />
          <input
            id="password"
            className="field-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar a cocina'}
        </button>
        <p className="login-foot">Los pedidos se actualizan solos</p>
      </form>
    </div>
  )
}
