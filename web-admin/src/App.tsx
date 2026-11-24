import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ventas from './pages/Ventas'
import Stock from './pages/Stock'
import Pedidos from './pages/Pedidos'
import Tickets from './pages/Tickets'
import Mesas from './pages/Mesas'
import Usuarios from './pages/Usuarios'
import Productos from './pages/Productos'
import Categorias from './pages/Categorias'
import { Spinner } from './components/Spinner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { ReloadToast } from './components/ReloadToast'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isPreloading, isReloading } = useAuth()
  if (isLoading)        return <div className="min-h-screen bg-bg flex items-center justify-center"><Spinner/></div>
  if (!isAuthenticated) return <Navigate to="/login" replace/>
  if (isPreloading)     return isReloading ? <ReloadToast/> : <LoadingScreen/>
  return <>{children}</>
}

function AppRoutes() {
  const wrap = (el: React.ReactElement) => <ErrorBoundary>{el}</ErrorBoundary>

  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace/>}/>
        <Route path="/dashboard" element={wrap(<Dashboard/>)}/>
        <Route path="/ventas"    element={wrap(<Ventas/>)}/>
        <Route path="/pedidos"   element={wrap(<Pedidos/>)}/>
        <Route path="/stock"     element={wrap(<Stock/>)}/>
        <Route path="/tickets"   element={wrap(<Tickets/>)}/>
        <Route path="/mesas"     element={wrap(<Mesas/>)}/>
        <Route path="/productos" element={wrap(<Productos/>)}/>
        <Route path="/categorias" element={wrap(<Categorias/>)}/>
        <Route path="/usuarios"  element={wrap(<Usuarios/>)}/>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes/>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
