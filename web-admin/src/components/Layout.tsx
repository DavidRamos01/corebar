import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, ShoppingBag, Package,
  Receipt, Map, Menu, X,
  Users, UtensilsCrossed, LogOut, Tag,
  Sun, Moon,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const NAV_PRINCIPAL = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen'   },
  { to: '/ventas',    icon: TrendingUp,      label: 'Ventas'    },
  { to: '/pedidos',   icon: ShoppingBag,     label: 'Pedidos'   },
  { to: '/mesas',     icon: Map,             label: 'Mesas'     },
  { to: '/productos', icon: UtensilsCrossed, label: 'Productos' },
  { to: '/tickets',   icon: Receipt,         label: 'Tickets'   },
]
const NAV_CONFIG = [
  { to: '/stock',    icon: Package, label: 'Stock'    },
  { to: '/categorias', icon: Tag,    label: 'Categorías' },
  { to: '/usuarios', icon: Users,   label: 'Personal' },
]

interface NavItemProps { to: string; icon: any; label: string; collapsed: boolean }

function NavItem({ to, icon: Icon, label, collapsed }: NavItemProps) {
  return (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
         ${isActive
           ? 'bg-accent text-white shadow-sm'
           : 'text-white/50 hover:text-white hover:bg-white/8'
         }`
      }
    >
      <Icon size={16} className="flex-shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
            className="whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  )
}

export default function Layout() {
  const [collapsedDesktop, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches)
  const location  = useLocation()
  const nav       = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const on = () => setIsMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => { setMobileOpen(false) }, [location.pathname, isMobile])

  const collapsed = isMobile ? false : collapsedDesktop

  const allNav  = [...NAV_PRINCIPAL, ...NAV_CONFIG]
  const current = allNav.find(n => location.pathname.startsWith(n.to))
  const pageTitle    = current?.label ?? 'Admin'

  const handleLogout = () => { logout(); nav('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      {isMobile && (
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-30 bg-black/50"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      )}
      <motion.aside
        initial={false}
        animate={isMobile
          ? { width: 260, x: mobileOpen ? 0 : -280 }
          : { width: collapsed ? 60 : 228, x: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className={`flex-shrink-0 h-full flex flex-col bg-sidebar shadow-sidebar overflow-hidden ${
          isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative z-20'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-white/8 flex-shrink-0 transition-all ${collapsed ? 'justify-center px-0 py-4' : 'gap-3 px-4 py-4'}`}>
          <div className="rounded-full bg-white flex-shrink-0 flex items-center justify-center p-1"
            style={{ width: collapsed ? 44 : 72, height: collapsed ? 44 : 72, transition: 'width .2s, height .2s' }}>
            <img
              src="/logo.png"
              alt="CoreBar"
              className="object-contain w-full h-full"
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <p className="font-bold text-sm text-white leading-none tracking-tight">CoreBar</p>
                <p className="text-[10px] text-white/40 mt-0.5">Gestión inteligente</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-2 overflow-y-auto space-y-0.5">

          {!collapsed && <p className="section-label px-3 mb-2">Principal</p>}
          {NAV_PRINCIPAL.map(item => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}

          <div className="my-3 border-t border-white/8 mx-1" />

          {!collapsed && <p className="section-label px-3 mb-2">Configuración</p>}
          {NAV_CONFIG.map(item => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>

        {/* User + logout */}
        <div className="border-t border-white/8 flex-shrink-0">
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mx-2 my-2 px-3 py-2 rounded-lg bg-white/6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{user.nombre}</p>
                    <p className="text-[10px] text-white/40 capitalize">{user.rol.toLowerCase()}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            <LogOut size={15} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Cerrar sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-14 flex items-center justify-between px-3 sm:px-6 border-b border-rim bg-surface flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => (isMobile ? setMobileOpen(o => !o) : setCollapsed(c => !c))}
              aria-label={isMobile ? 'Abrir menú' : 'Contraer menú'}
              className="w-8 h-8 rounded-lg hover:bg-surface2 flex items-center justify-center text-muted hover:text-ink transition-colors"
            >
              {isMobile ? (mobileOpen ? <X size={16} /> : <Menu size={16} />) : (collapsed ? <Menu size={16} /> : <X size={16} />)}
            </button>
            <div>
              <h1 className="font-bold text-base text-ink leading-none">{pageTitle}</h1>
              <p className="text-[11px] text-muted mt-0.5 capitalize">
                {`Bienvenido de nuevo, ${user?.nombre.split(' ')[0] ?? 'Admin'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Date */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rim bg-surface2 text-xs font-medium text-muted">
              {format(new Date(), "d MMM yyyy", { locale: es })}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="w-8 h-8 rounded-lg border border-rim bg-surface2 flex items-center justify-center text-muted hover:text-ink hover:border-rim-2 transition-all"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: .18, ease: [.22, 1, .36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
