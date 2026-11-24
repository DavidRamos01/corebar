import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Euro, ShoppingBag, UtensilsCrossed, TrendingUp, AlertTriangle,
  ArrowRight, Clock, Zap,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { useAsync } from '../hooks/useAsync'
import { getFacturas, getMesas, getProductos, getPedidos, getDetailedPedidos, getFacturasSync, getMesasSync, getProductosSync, getPedidosSync, getDetailedPedidosSync } from '../api'
import type { FacturaResponse, PedidoResponse, MesaResponse } from '../api/types'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

const CAT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']
const DOW_NAMES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ── helpers ──────────────────────────────────────────────────────────────────
function buildWeeklySales(facturas: FacturaResponse[]) {
  const map: Record<string, { date: string; revenue: number; orders: number }> = {}
  facturas.forEach(f => {
    const d = f.fechaEmision ? format(parseISO(f.fechaEmision), 'EEE', { locale: es }) : '?'
    if (!map[d]) map[d] = { date: d, revenue: 0, orders: 0 }
    map[d].revenue += f.total
    map[d].orders  += 1
  })
  // Return ordered Mon–Sun
  const ordered = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
  return ordered.map(k => map[k] ?? { date: k, revenue: 0, orders: 0 })
}

function buildCategoryRevenue(productos: import('../api/types').ProductoResponse[]) {
  const map: Record<string, number> = {}
  productos.forEach(p => {
    const cat = p.categoria?.nombre ?? 'Otros'
    map[cat] = (map[cat] ?? 0) + 1
  })
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], i) => ({
      name, value, pct: Math.round((value / total) * 100), color: CAT_COLORS[i],
    }))
}

function buildTopProducts(
  productos: import('../api/types').ProductoResponse[],
  allPedidos: PedidoResponse[],
) {
  // Index catalogue for imagenUrl cross-reference (toDetalle always sets imagenUrl=null)
  const catIndex: Record<string, import('../api/types').ProductoResponse> = {}
  productos.forEach(p => { catIndex[p.idProducto] = p; catIndex[p.nombre] = p })

  // Aggregate units sold from pedido detalles
  const unitMap: Record<string, { name: string; cat: string; imagenUrl: string | null; units: number }> = {}
  allPedidos.forEach(p => {
    p.detalles.forEach(d => {
      const key = String(d.producto?.idProducto ?? d.producto?.nombre ?? '?')
      const fromCat = catIndex[d.producto?.idProducto ?? ''] ?? catIndex[d.producto?.nombre ?? '']
      if (!unitMap[key]) unitMap[key] = {
        name:      d.producto?.nombre ?? '?',
        cat:       d.producto?.categoria?.nombre ?? fromCat?.categoria?.nombre ?? '—',
        imagenUrl: fromCat?.imagenUrl ?? null,
        units:     0,
      }
      unitMap[key].units += d.cantidad
    })
  })

  const fromOrders = Object.values(unitMap).sort((a, b) => b.units - a.units).slice(0, 5)
  if (fromOrders.length > 0) {
    return fromOrders.map(p => ({ name: p.name, cat: p.cat, count: p.units, revenue: 0, imagenUrl: p.imagenUrl }))
  }

  // Fallback: products sorted by price when no sales data available
  return [...productos]
    .sort((a, b) => b.precio - a.precio)
    .slice(0, 5)
    .map(p => ({ name: p.nombre, cat: p.categoria?.nombre ?? '—', count: p.stockActual, revenue: p.precio, imagenUrl: p.imagenUrl }))
}

function relativeDay(iso: string): string {
  const d = parseISO(iso)
  const t = format(d, 'HH:mm')
  if (isToday(d))     return `Hoy ${t}`
  if (isYesterday(d)) return `Ayer ${t}`
  return `${format(d, 'EEE', { locale: es })} ${t}`
}

function buildRecentActivity(facturas: FacturaResponse[], pedidos: PedidoResponse[]) {
  const items: { type: string; text: string; sub: string; time: string; color: string; icon: any }[] = []

  // last 3 facturas paid
  facturas.slice(0, 3).forEach(f => {
    items.push({
      type:  'ticket',
      text:  `Ticket #${f.idFactura} completado`,
      sub:   `€${f.total.toFixed(2)} · ${f.metodoPago.toLowerCase()}`,
      time:  f.fechaEmision ? relativeDay(f.fechaEmision) : '—',
      color: 'bg-success/10 text-success',
      icon:  ShoppingBag,
    })
  })

  // last 3 open pedidos
  pedidos.slice(0, 3).forEach(p => {
    items.push({
      type:  'pedido',
      text:  `Nuevo pedido #${p.idPedido}`,
      sub:   `Mesa ${p.mesa?.numero ?? '—'} · ${p.usuario?.nombre?.split(' ')[0] ?? '—'}`,
      time:  p.fechaCreacion ? relativeDay(p.fechaCreacion) : '—',
      color: 'bg-accent/10 text-accent',
      icon:  Zap,
    })
  })

  return items.slice(0, 6)
}

// ── Mesa visual ───────────────────────────────────────────────────────────────
const TW = 62    // table width px
const TH = 48    // table height px
const CR = 8     // chair circle radius
const CGAP = 6   // gap table-edge → chair-center
const CO = CR + CGAP  // chair offset from table edge = cell margin needed

function mesaColors(estado: string) {
  if (estado === 'OCUPADA')   return { base:'#f59e0b', bg:'#f59e0b18', border:'#f59e0b55', chair:'#f59e0b44' }
  if (estado === 'RESERVADA') return { base:'#3b82f6', bg:'#3b82f618', border:'#3b82f655', chair:'#3b82f644' }
  return { base:'#10b981', bg:'#10b98114', border:'#10b98144', chair:'#10b98133' }
}

function distributeChairs(cap: number) {
  const n = Math.max(2, Math.min(cap || 4, 10))
  const top    = Math.max(1, Math.round(n * 0.3))
  const bottom = Math.max(1, Math.round(n * 0.3))
  const rem    = Math.max(0, n - top - bottom)
  return { top, bottom, left: Math.ceil(rem / 2), right: Math.floor(rem / 2) }
}

function buildChairPositions(cap: number) {
  const { top, bottom, left, right } = distributeChairs(cap)
  const chairs: { x: number; y: number }[] = []
  const ox = CO, oy = CO  // table top-left inside cell

  // Top — along top edge
  for (let i = 0; i < top; i++)
    chairs.push({ x: ox + (TW / (top + 1)) * (i + 1) - CR, y: 0 })
  // Bottom
  for (let i = 0; i < bottom; i++)
    chairs.push({ x: ox + (TW / (bottom + 1)) * (i + 1) - CR, y: oy + TH + CGAP })
  // Left
  for (let i = 0; i < left; i++)
    chairs.push({ x: 0, y: oy + (TH / (left + 1)) * (i + 1) - CR })
  // Right
  for (let i = 0; i < right; i++)
    chairs.push({ x: ox + TW + CGAP, y: oy + (TH / (right + 1)) * (i + 1) - CR })

  return chairs
}

const CELL_W = TW + CO * 2
const CELL_H = TH + CO * 2

function TableWidget({ m, posStyle }: { m: MesaResponse; posStyle?: React.CSSProperties }) {
  const c      = mesaColors(m.estado)
  const chairs = buildChairPositions(m.capacidad)
  return (
    <div
      title={`Mesa ${m.numero} · ${m.capacidad ?? '?'}p · ${m.estado.toLowerCase()}`}
      style={{ position:'relative', width:CELL_W, height:CELL_H, flexShrink:0, cursor:'default', ...posStyle }}
    >
      {/* Chairs — circular */}
      {chairs.map((ch, i) => (
        <div key={i} style={{
          position:'absolute', left:ch.x, top:ch.y,
          width:CR*2, height:CR*2, borderRadius:'50%',
          background:c.chair, border:`1.5px solid ${c.border}`,
        }}/>
      ))}
      {/* Table body */}
      <div style={{
        position:'absolute', left:CO, top:CO, width:TW, height:TH,
        borderRadius:10, border:`2px solid ${c.border}`, background:c.bg,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
      }}>
        <span style={{ color:c.base, fontWeight:700, fontSize:13, lineHeight:1 }}>{m.numero}</span>
        {(m.capacidad ?? 0) > 0 && (
          <span style={{ color:c.base, fontSize:8, opacity:.65, lineHeight:1 }}>{m.capacidad}p</span>
        )}
      </div>
    </div>
  )
}

function MesaFloorPlan({ mesas }: { mesas: MesaResponse[] }) {
  const hasPositions = mesas.some(m => m.posX > 0 || m.posY > 0)
  const CANVAS_PAD = 16

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {hasPositions ? (() => {
        const maxX = Math.max(...mesas.map(m => m.posX)) + CELL_W + CANVAS_PAD * 2
        const maxY = Math.max(...mesas.map(m => m.posY)) + CELL_H + CANVAS_PAD * 2
        return (
          <div className="flex-1 min-h-0 rounded-xl border border-rim bg-surface2 overflow-auto">
            <div style={{ position:'relative', width:maxX, height:maxY, minWidth:'100%' }}>
              {mesas.map(m => (
                <TableWidget key={m.idMesa} m={m} posStyle={{
                  position:'absolute',
                  left: CANVAS_PAD + m.posX - CO,
                  top:  CANVAS_PAD + m.posY - CO,
                }}/>
              ))}
            </div>
          </div>
        )
      })() : (
        <div className="flex-1 overflow-auto rounded-xl border border-rim bg-surface2">
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, ${CELL_W}px)`,
            gap: 20,
            padding: 16,
            justifyContent: 'center',
          }}>
            {mesas.map(m => <TableWidget key={m.idMesa} m={m} />)}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted flex-shrink-0">
        {[{ color:'bg-success', label:'Libre' },{ color:'bg-warning', label:'Ocupada' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${l.color}`}/>{l.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: facturas,   loading: lF, error: eF, refetch: rF } = useAsync(getFacturas, [], getFacturasSync)
  const { data: mesas,      loading: lM, error: eM }               = useAsync(getMesas, [], getMesasSync)
  const { data: productos,  loading: lP }                          = useAsync(getProductos, [], getProductosSync)
  const { data: pedidos,    loading: lO }                          = useAsync(() => getPedidos({ estado: 'ABIERTO' }), [], () => getPedidosSync({ estado: 'ABIERTO' }))
  const { data: allPedidos }                                       = useAsync(getDetailedPedidos, [], getDetailedPedidosSync)

  const analytics = useMemo(() => {
    if (!facturas) return null
    return {
      totalRevenue:   facturas.reduce((s, f) => s + f.total, 0),
      totalFacturas:  facturas.length,
      avgTicket:      facturas.length ? facturas.reduce((s, f) => s + f.total, 0) / facturas.length : 0,
      weeklySales:    buildWeeklySales(facturas),
      catRevenue:     buildCategoryRevenue(productos ?? []),
      topProducts:    buildTopProducts(productos ?? [], allPedidos ?? []),
      recentActivity: buildRecentActivity(facturas, pedidos ?? []),
    }
  }, [facturas, pedidos, productos, allPedidos])

  const mesaStats = useMemo(() => ({
    ocupadas:   mesas?.filter(m => m.estado === 'OCUPADA').length   ?? 0,
    libres:     mesas?.filter(m => m.estado === 'LIBRE').length     ?? 0,
    reservadas: mesas?.filter(m => m.estado === 'RESERVADA').length ?? 0,
    total:      mesas?.length ?? 0,
  }), [mesas])

  const ocupacionPct = mesaStats.total > 0 ? Math.round(mesaStats.ocupadas / mesaStats.total * 100) : 0
  const lowStock     = productos?.filter(p => p.stockActual <= 5) ?? []

  if (lF || lM || lP || lO) return <Spinner />
  if (eF) return <ErrorBanner message={eF} onRetry={rF} />

  return (
    <div className="space-y-6">

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Ingresos totales" value={analytics?.totalRevenue ?? 0} prefix="€" decimals={2}
          icon={Euro} iconBg="bg-indigo-50" iconColor="text-accent"
          change={14.2} description="vs semana anterior" delay={0}
        />
        <StatCard
          title="Tickets emitidos" value={analytics?.totalFacturas ?? 0}
          icon={ShoppingBag} iconBg="bg-emerald-50" iconColor="text-success"
          change={8.7} description="vs semana anterior" delay={.05}
        />
        <StatCard
          title="Mesas ocupadas" value={ocupacionPct} suffix="%"
          icon={UtensilsCrossed} iconBg="bg-orange-50" iconColor="text-warning"
          change={5.1} description="promedio diario" delay={.1}
        />
        <StatCard
          title="Ticket medio" value={analytics?.avgTicket ?? 0} prefix="€" decimals={2}
          icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-info"
          change={11.3} description="vs semana anterior" delay={.15}
        />
        <StatCard
          title="Stock crítico" value={lowStock.length}
          icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-danger"
          change={-2} description="productos" delay={.2}
        />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Ingresos area chart — 2/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .25, duration: .35 }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-ink">Ingresos</p>
              <p className="text-xs text-muted">Evolución semanal</p>
            </div>
            <span className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent rounded inline-block"/>Esta semana</span>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics?.weeklySales} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#9faac2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9faac2', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip {...TT} formatter={(v: any) => [`€${Number(v).toFixed(2)}`, 'Ingresos']} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gAcc)" dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ingresos por categoría donut — 1/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .3, duration: .35 }}
          className="card p-5"
        >
          <div className="mb-3">
            <p className="font-semibold text-ink">Productos por categoría</p>
            <p className="text-xs text-muted">Distribución del catálogo</p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={analytics?.catRevenue}
                cx="50%" cy="50%"
                innerRadius={40} outerRadius={68}
                paddingAngle={2} dataKey="value"
              >
                {analytics?.catRevenue.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip {...TT} formatter={(v: any, _, p: any) => [`${v} productos (${p.payload.pct}%)`, p.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {analytics?.catRevenue.slice(0, 5).map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-ink truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="text-muted font-medium tabular-nums">{c.value} ({c.pct}%)</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom row: Top productos + Mapa mesas + Alertas ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top productos */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .35, duration: .35 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
            <div>
              <p className="font-semibold text-ink">Top productos</p>
              <p className="text-xs text-muted">Por unidades vendidas</p>
            </div>
            <Link to="/productos" className="text-xs text-accent hover:text-accent-dim flex items-center gap-1 font-medium">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-rim">
            {(analytics?.topProducts ?? []).length === 0
              ? <p className="text-xs text-muted text-center py-8">Sin datos de ventas</p>
              : (analytics?.topProducts ?? []).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-xs font-bold text-faint w-4 text-center">{i + 1}</span>
                  {p.imagenUrl
                    ? <img src={p.imagenUrl} alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover border border-rim flex-shrink-0"
                        onError={e => { const el = e.currentTarget; el.style.display='none'; (el.nextElementSibling as HTMLElement|null)?.style.setProperty('display','flex') }}/>
                    : null}
                  <div className="w-8 h-8 rounded-lg bg-surface2 border border-rim items-center justify-center flex-shrink-0"
                    style={{ display: p.imagenUrl ? 'none' : 'flex' }}>
                    <UtensilsCrossed size={13} className="text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                    <p className="text-[10px] text-muted">{p.cat}</p>
                  </div>
                  <p className="text-sm font-bold text-ink tabular-nums whitespace-nowrap">
                    {p.revenue > 0 ? `€${p.revenue.toFixed(2)}` : `${p.count} ud`}
                  </p>
                </div>
              ))
            }
          </div>
        </motion.div>

        {/* Estado del salón */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .4, duration: .35 }}
          className="card overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-rim flex-shrink-0">
            <div>
              <p className="font-semibold text-ink">Estado del salón</p>
              <p className="text-xs text-muted">
                {mesaStats.ocupadas} ocupadas · {mesaStats.libres} libres · {mesaStats.total} total
              </p>
            </div>
            <Link to="/mesas" className="text-xs text-accent hover:text-accent-dim font-medium flex items-center gap-1">
              Gestionar <ArrowRight size={11}/>
            </Link>
          </div>

          {/* Occupation bar */}
          <div className="px-5 pt-3 pb-2 flex-shrink-0">
            <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
              <div className="h-full rounded-full bg-warning transition-all" style={{ width: `${ocupacionPct}%` }} />
            </div>
            <p className="text-[10px] text-faint mt-1">{ocupacionPct}% ocupación</p>
          </div>

          {/* Mesa rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-rim">
            {[...(mesas ?? [])]
              .sort((a, b) => {
                const o = { OCUPADA: 0, RESERVADA: 1, LIBRE: 2 }
                return (o[a.estado] ?? 3) - (o[b.estado] ?? 3)
              })
              .map(m => {
                const openOrder = pedidos?.find(p => p.mesa?.idMesa === m.idMesa)
                return (
                  <div key={m.idMesa} className="flex items-center gap-3 px-5 py-2.5">
                    {/* Mesa number */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                      ${m.estado === 'OCUPADA'   ? 'bg-warning/15 text-warning'
                      : m.estado === 'RESERVADA' ? 'bg-info/15 text-info'
                      :                            'bg-success/10 text-success'}`}>
                      {m.numero}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink">Mesa {m.numero}</p>
                      <p className="text-[10px] text-muted truncate">
                        {openOrder
                          ? `Pedido #${openOrder.idPedido} · €${openOrder.total.toFixed(2)}`
                          : m.capacidad > 0 ? `${m.capacidad} personas` : 'Sin pedido activo'}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span className={`badge border text-[9px] flex-shrink-0
                      ${m.estado === 'OCUPADA'   ? 'bg-warning/15 text-warning border-warning/30'
                      : m.estado === 'RESERVADA' ? 'bg-info/15 text-info border-info/30'
                      :                            'bg-success/10 text-success border-success/20'}`}>
                      {m.estado === 'OCUPADA' ? 'Ocupada' : m.estado === 'RESERVADA' ? 'Reservada' : 'Libre'}
                    </span>
                  </div>
                )
              })
            }
          </div>
        </motion.div>

        {/* Actividad reciente + Alertas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .45, duration: .35 }}
          className="card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
            <p className="font-semibold text-ink">Actividad reciente</p>
            <Link to="/pedidos" className="text-xs text-accent hover:text-accent-dim font-medium flex items-center gap-1">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>

          {/* Stock alerts */}
          {lowStock.length > 0 && (
            <div className="relative px-5 py-3 border-b border-rim pl-6">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500 animate-pulse" />
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                <p className="text-[11px] font-medium text-muted uppercase tracking-wider">Stock bajo</p>
              </div>
              {lowStock.slice(0, 2).map(p => (
                <div key={p.idProducto} className="flex justify-between text-xs text-muted py-0.5">
                  <span className="truncate text-ink">{p.nombre}</span>
                  <span className="font-semibold ml-2 text-red-400">{p.stockActual} ud</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent activity items */}
          <div className="divide-y divide-rim max-h-64 overflow-y-auto">
            {(analytics?.recentActivity ?? []).length === 0
              ? <p className="text-xs text-muted text-center py-8">Sin actividad reciente</p>
              : (analytics?.recentActivity ?? []).map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <item.icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink">{item.text}</p>
                    <p className="text-[10px] text-muted mt-0.5">{item.sub}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-faint whitespace-nowrap mt-0.5">
                    <Clock size={9} />
                    {item.time}
                  </div>
                </div>
              ))
            }
          </div>

          {/* Open pedidos summary */}
          <div className="px-5 py-3 bg-surface2 border-t border-rim">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Pedidos abiertos ahora</p>
              <span className="text-sm font-bold text-ink">{pedidos?.length ?? 0}</span>
            </div>
            <p className="text-[10px] text-faint mt-0.5">
              Total: €{pedidos?.reduce((s, p) => s + p.total, 0).toFixed(2) ?? '0.00'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
