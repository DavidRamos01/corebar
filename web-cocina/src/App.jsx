import { useState } from 'react'
import { getToken, clearToken } from './api'
import Login from './components/Login'
import KitchenBoard from './components/KitchenBoard'

export default function App() {
  const [token, setToken] = useState(() => getToken())

  function handleLogout() {
    clearToken()
    setToken('')
  }

  if (!token) {
    return <Login onLogin={setToken} />
  }

  return <KitchenBoard onLogout={handleLogout} />
}
