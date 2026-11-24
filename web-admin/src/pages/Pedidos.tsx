import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useAsync } from '../hooks/useAsync'
import { getPedidos, getPedido, cambiarEstadoPedido, cambiarEstadoDetalle, getPedidosSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import type { PedidoResponse, DetallePedidoResponse } from '../api/types'
import { Portal } from '../components/Portal'
import { useToast, errMsg } from '../context/ToastContext'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

const ESTADO_PEDIDO: PedidoResponse['estado'][] = ['ABIERTO','PAGADO']
const ESTADO_COLORS: Record<string,string> = {
  ABIERTO:'bg-green-500/15 text-green-400 border-green-500/20',
  PAGADO: 'bg-surface2 text-muted border-rim',
}
const DETALLE_COLORS: Record<string, string> = {
  PENDIENTE:      'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  EN_PREPARACION: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  SERVIDO:        'bg-green-500/15 text-green-400 border-green-500/20',
  CANCELADO:      'bg-red-500/15 text-red-400 border-red-500/20',
}

function OrderDetailModal({ pedido: pedidoBase, onClose, onRefetch }: { pedido:PedidoResponse; onClose:()=>void; onRefetch:()=>void }) {
  const [pedido, setPedido] = useState<PedidoResponse>(pedidoBase)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [changing, setChanging] = useState<number|null>(null)
  const toast = useToast()

  useEffect(() => {
    getPedido(pedidoBase.idPedido)
      .then(p => setPedido(p))
      .catch(err => toast.error(errMsg(err, 'No se pudo cargar el detalle del pedido.')))
      .finally(() => setLoadingDetail(false))
  }, [pedidoBase.idPedido])

  const changeDetalleEstado = async (detalleId:number, estado:string) => {
    setChanging(detalleId)
    try {
      await cambiarEstadoDetalle(pedido.idPedido, detalleId, estado); onRefetch()
      getPedido(pedido.idPedido).then(setPedido).catch(()=>{})
      toast.success('Estado del producto actualizado.')
    }
    catch (err) { toast.error(errMsg(err, 'No se pudo cambiar el estado del producto.')) }
    finally { setChanging(null) }
  }

  const changePedidoEstado = async (estado:string) => {
    try {
      await cambiarEstadoPedido(pedido.idPedido, estado); onRefetch(); onClose()
      toast.success(estado === 'PAGADO' ? 'Pedido cobrado correctamente.' : 'Estado del pedido actualizado.')
    }
    catch (err) { toast.error(errMsg(err, 'No se pudo cambiar el estado del pedido.')) }
  }

  const NEXT_DETALLE: Record<string,string> = {
    PENDIENTE:'EN_PREPARACION', EN_PREPARACION:'SERVIDO', SERVIDO:'CANCELADO'
  }

  return (
    <Portal><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,y:24,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:24,scale:.95}}
        transition={{duration:.25,ease:[.22,1,.36,1]}}
        onClick={e=>e.stopPropagation()}
        className="bg-surface border border-rim rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rim">
          <div>
            <p className="font-bold text-xl text-ink">Pedido #{pedido.idPedido}</p>
            <p className="text-xs text-muted">Mesa {pedido.mesa?.numero ?? '—'} · {pedido.usuario?.nombre ?? '—'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-muted hover:text-ink">
            <X size={15}/>
          </button>
        </div>

        <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
          {loadingDetail && <p className="text-xs text-muted text-center py-4">Cargando detalles…</p>}
          {!loadingDetail && (pedido.detalles??[]).length === 0 && <p className="text-xs text-muted text-center py-4">Sin ítems</p>}
          {(pedido.detalles??[]).map(d => (
            <div key={d.idDetallePedido} className="flex items-center justify-between py-2.5 border-b border-rim">
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{d.producto?.nombre ?? '—'}</p>
                <p className="text-xs text-muted">x{d.cantidad} × €{(d.precioUnitario??0).toFixed(2)} · <span className="capitalize">{d.producto?.categoria?.nombre ?? ''}</span></p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className={`badge border text-[10px] capitalize ${DETALLE_COLORS[d.estado]}`}>
                  {d.estado.replace('_',' ').toLowerCase()}
                </span>
                {NEXT_DETALLE[d.estado] && (
                  <button onClick={() => changeDetalleEstado(d.idDetallePedido, NEXT_DETALLE[d.estado])}
                    disabled={changing===d.idDetallePedido}
                    className="text-xs text-accent hover:text-accent/80 font-medium disabled:opacity-40">
                    {changing===d.idDetallePedido ? '…' : '→'}
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-ink ml-3">€{(d.cantidad*d.precioUnitario).toFixed(2)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <p className="font-bold text-ink">Total</p>
            <p className="text-xl font-bold text-green-400">€{pedido.total.toFixed(2)}</p>
          </div>
        </div>

        {pedido.estado==='ABIERTO' && (
          <div className="px-6 py-4 border-t border-rim">
            <button onClick={() => changePedidoEstado('PAGADO')}
              className="btn-primary w-full justify-center">
              Marcar como pagado
            </button>
          </div>
        )}
      </motion.div>
    </div></Portal>
  )
}

export default function Pedidos() {
  const { data:pedidos, loading, error, refetch } = useAsync(getPedidos, [], () => getPedidosSync())
  const [search,   setSearch]   = useState('')
  const [estado,   setEstado]   = useState<'todos'|'ABIERTO'|'PAGADO'>('todos')
  const [selected, setSelected] = useState<PedidoResponse|null>(null)
  const [page,     setPage]     = useState(0)
  const PER_PAGE = 14

  const filtered = useMemo(() => (pedidos??[]).filter(p => {
    const matchQ = String(p.idPedido).includes(search) || p.usuario?.nombre?.toLowerCase().includes(search.toLowerCase())
    const matchS = estado==='todos' || p.estado===estado
    return matchQ && matchS
  }), [pedidos, search, estado])

  const paginated = filtered.slice(page*PER_PAGE, (page+1)*PER_PAGE)
  const pages     = Math.ceil(filtered.length/PER_PAGE)

  // Stats
  const abiertos = pedidos?.filter(p=>p.estado==='ABIERTO').length ?? 0
  const pagados  = pedidos?.filter(p=>p.estado==='PAGADO').length ?? 0
  const totalRev = pedidos?.filter(p=>p.estado==='PAGADO').reduce((s,p)=>s+p.total,0) ?? 0

  // Waiter chart
  const waiterMap: Record<string,number> = {}
  pedidos?.filter(p=>p.estado==='PAGADO').forEach(p => {
    const w = p.usuario?.nombre ?? '?'
    waiterMap[w] = (waiterMap[w]??0)+1
  })
  const waiterData = Object.entries(waiterMap).map(([name,count])=>({name:name.split(' ')[0],count})).sort((a,b)=>b.count-a.count)

  // Status donut
  const statusData = [
    {name:'Abiertos', value:abiertos, color:'#22C55E'},
    {name:'Pagados',  value:pagados,  color:'#9faac2'},
  ]

  // Ingresos por camarero (pedidos pagados)
  const waiterRevMap: Record<string,number> = {}
  pedidos?.filter(p=>p.estado==='PAGADO').forEach(p => {
    const w = p.usuario?.nombre?.split(' ')[0] ?? '?'
    waiterRevMap[w] = (waiterRevMap[w]??0) + p.total
  })
  const waiterRevData = Object.entries(waiterRevMap)
    .sort((a,b)=>b[1]-a[1])
    .map(([name,revenue])=>({ name, revenue: Math.round(revenue*100)/100 }))

  if (loading) return <Spinner/>
  if (error)   return <ErrorBanner message={error} onRetry={refetch}/>

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Pedidos totales',  value:pedidos?.length??0,       color:'text-accent'},
          {label:'Abiertos',         value:abiertos,                  color:'text-green-400'},
          {label:'Ingresos pagados', value:`€${totalRev.toFixed(2)}`, color:'text-amber-400'},
        ].map((c,i)=>(
          <motion.div key={c.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06,duration:.25,ease:[.22,1,.36,1]}}
            className="card p-4">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-[26px] font-bold tabular-nums leading-none ${c.color}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-3">Estado de pedidos</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3}>
                {statusData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
              </Pie>
              <Tooltip {...TT} formatter={(v:any,_:string,p:any)=>[v,p.payload.name]}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map(s=>(
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:s.color}}/>
                <span className="text-muted">{s.name}: <span className="text-ink font-semibold">{s.value}</span></span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.25,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-3">Pedidos por camarero</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={waiterData} margin={{top:0,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT} formatter={(v:any)=>[v,'Pedidos']}/>
              <Bar dataKey="count" fill="#F59E0B" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.3,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-3">Ingresos por camarero</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={waiterRevData} margin={{top:0,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`}/>
              <Tooltip {...TT} formatter={(v:any)=>[`€${Number(v).toFixed(2)}`,'Ingresos']}/>
              <Bar dataKey="revenue" fill="#F59E0B" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {(['todos','ABIERTO','PAGADO'] as const).map(s=>(
          <button key={s} onClick={()=>{setEstado(s);setPage(0)}}
            className={`badge border cursor-pointer transition-all capitalize ${
              estado===s ? 'bg-accent/15 text-accent border-accent/30' : 'bg-surface2 text-muted border-rim hover:text-ink'
            }`}>{s==='todos'?'Todos':s.toLowerCase()}</button>
        ))}
        <div className="relative flex items-center flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 text-faint"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}
            className="input input-icon w-full h-9 text-sm" placeholder="Buscar por ID o camarero"/>
        </div>
        <button onClick={refetch} className="btn-ghost h-9 px-3"><RefreshCw size={14}/></button>
        <span className="text-xs text-muted ml-auto">{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35,duration:.4,ease:[.22,1,.36,1]}}
        className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-faint text-xs uppercase tracking-wider border-b border-rim bg-surface2">
              <th className="px-5 py-3.5 text-left font-medium">ID</th>
              <th className="px-3 py-3.5 text-left font-medium">Mesa</th>
              <th className="px-3 py-3.5 text-left font-medium hidden md:table-cell">Camarero</th>
              <th className="px-3 py-3.5 text-left font-medium hidden sm:table-cell">Fecha</th>
              <th className="px-3 py-3.5 text-right font-medium">Total</th>
              <th className="px-3 py-3.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p,i)=>(
              <motion.tr key={p.idPedido} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.02}}
                onClick={()=>setSelected(p)}
                className="border-b border-rim hover:bg-surface2 transition-colors cursor-pointer">
                <td className="px-5 py-3 font-mono text-xs text-accent">#{p.idPedido}</td>
                <td className="px-3 py-3 font-bold">Mesa {p.mesa?.numero ?? '—'}</td>
                <td className="px-3 py-3 text-xs text-muted hidden md:table-cell">{p.usuario?.nombre ?? '—'}</td>
                <td className="px-3 py-3 hidden sm:table-cell text-xs text-muted">
                  {p.fechaCreacion ? format(parseISO(p.fechaCreacion),'dd/MM HH:mm') : '—'}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-green-400">€{p.total.toFixed(2)}</td>
                <td className="px-3 py-3">
                  <span className={`badge border ${ESTADO_COLORS[p.estado]}`}>{p.estado.toLowerCase()}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {pages>1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-rim">
            <p className="text-xs text-muted">Página {page+1} de {pages}</p>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="btn-ghost h-8 px-3 text-xs disabled:opacity-40">Anterior</button>
              <button disabled={page===pages-1} onClick={()=>setPage(p=>p+1)} className="btn-ghost h-8 px-3 text-xs disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selected && <OrderDetailModal pedido={selected} onClose={()=>setSelected(null)} onRefetch={refetch}/>}
      </AnimatePresence>
    </div>
  )
}
