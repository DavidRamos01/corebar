import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from 'recharts'
import { Euro, TrendingUp, ShoppingBag, CreditCard, Receipt } from 'lucide-react'
import { format, parseISO, subDays, isAfter } from 'date-fns'
import { useAsync } from '../hooks/useAsync'
import { getFacturas, getFacturasSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import type { FacturaResponse } from '../api/types'

type Period = '7d' | '30d' | 'todo'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

function filterByPeriod(facturas: FacturaResponse[], period: Period) {
  if (period==='todo') return facturas
  const cutoff = subDays(new Date(), period==='7d'?7:30)
  return facturas.filter(f => f.fechaEmision ? isAfter(parseISO(f.fechaEmision), cutoff) : false)
}

function buildDailySeries(facturas: FacturaResponse[]) {
  const map: Record<string,{date:string;revenue:number;orders:number;avgTicket:number}> = {}
  facturas.forEach(f => {
    const d = f.fechaEmision ? format(parseISO(f.fechaEmision),'dd/MM') : '—'
    if (!map[d]) map[d]={date:d,revenue:0,orders:0,avgTicket:0}
    map[d].revenue += f.total
    map[d].orders  += 1
  })
  return Object.values(map).map(d=>({...d, avgTicket:Math.round((d.revenue/d.orders)*100)/100}))
}

export default function Ventas() {
  const { data: facturas, loading, error, refetch } = useAsync(getFacturas, [], getFacturasSync)
  const [period, setPeriod] = useState<Period>('30d')

  const filtered = useMemo(()=>facturas ? filterByPeriod(facturas,period) : [], [facturas,period])
  const daily    = useMemo(()=>buildDailySeries(filtered), [filtered])

  const totalRev  = filtered.reduce((s,f)=>s+f.total,0)
  const totalOrd  = filtered.length
  const avgTicket = totalOrd ? totalRev/totalOrd : 0
  const ivaTotal  = filtered.reduce((s,f)=>s+f.totalIva,0)
  const subtotal  = filtered.reduce((s,f)=>s+f.subtotal,0)

  const byPayment = (['EFECTIVO','TARJETA','BIZUM'] as const).map(m=>({
    name:m, count:filtered.filter(f=>f.metodoPago===m).length,
    revenue:filtered.filter(f=>f.metodoPago===m).reduce((s,f)=>s+f.total,0),
  }))

  // Revenue by day of week (Mon–Sun)
  const DOW_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const DOW_COLORS = ['#F59E0B','#22C55E','#60A5FA','#EF4444','#06B6D4','#EC4899','#8B5CF6']
  const dowMap: Record<number,number> = {}
  filtered.forEach(f => {
    if (!f.fechaEmision) return
    const d = parseISO(f.fechaEmision).getDay()
    dowMap[d] = (dowMap[d]??0) + f.total
  })
  const dowData = DOW_NAMES.map((name,i) => ({ name, value: Math.round((dowMap[i]??0)*100)/100, color: DOW_COLORS[i] }))

  // Avg ticket trend
  const avgTrend = daily.slice(-10)

  if (loading) return <Spinner/>
  if (error)   return <ErrorBanner message={error} onRetry={refetch}/>

  return (
    <div className="space-y-6">
      {/* Period */}
      <div className="flex items-center gap-2 flex-wrap">
        {([['7d','7 días'],['30d','30 días'],['todo','Todo']] as const).map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              period===k ? 'bg-accent text-bg font-bold shadow-lg shadow-accent/30' : 'bg-surface2 text-muted hover:text-ink border border-rim'
            }`}>{l}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted">{totalOrd} facturas en el período</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {label:'Ingresos brutos', value:`€${totalRev.toFixed(2)}`,  icon:Euro,        iconColor:'text-accent'    },
          {label:'Facturas',         value:totalOrd,                    icon:Receipt,     iconColor:'text-green-400' },
          {label:'Ticket medio',     value:`€${avgTicket.toFixed(2)}`, icon:CreditCard,  iconColor:'text-amber-400' },
          {label:'IVA recaudado',    value:`€${ivaTotal.toFixed(2)}`,  icon:TrendingUp,  iconColor:'text-blue-400'  },
          {label:'Base imponible',   value:`€${subtotal.toFixed(2)}`,  icon:ShoppingBag, iconColor:'text-muted' },
        ].map((k,i)=>(
          <motion.div key={k.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06,duration:.25,ease:[.22,1,.36,1]}}
            className="card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <k.icon size={12} className={k.iconColor}/>
              <p className="text-[11px] font-semibold text-faint uppercase tracking-wider truncate">{k.label}</p>
            </div>
            <p className="text-[22px] font-bold text-ink tabular-nums leading-none">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue + avgTicket trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-6 lg:col-span-2">
          <p className="font-semibold text-ink mb-1">Evolución de ingresos y pedidos</p>
          <p className="text-xs text-muted mb-4">Doble eje: ingresos (izq) · pedidos (der)</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={daily} margin={{top:4,right:4,left:-16,bottom:0}}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={.3}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22C55E" stopOpacity={.25}/><stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="r" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`}/>
              <YAxis yAxisId="o" orientation="right" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT} formatter={(v:any,n:string)=>n==='revenue'?[`€${Number(v).toFixed(2)}`,'Ingresos']:n==='orders'?[v,'Facturas']:[`€${Number(v).toFixed(2)}`,'Ticket medio']}/>
              <Area yAxisId="r" type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gR)" dot={false}/>
              <Area yAxisId="o" type="monotone" dataKey="orders"  stroke="#22C55E" strokeWidth={2}   fill="url(#gO)" dot={false}/>
              <Legend wrapperStyle={{color:'#9faac2',fontSize:11}} formatter={v=>v==='revenue'?'Ingresos':'Facturas'}/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue by day of week */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.25,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-1">Por día de la semana</p>
          <p className="text-xs text-muted mb-3">Ingresos según el día</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={dowData} margin={{top:4,right:4,left:-24,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`}/>
              <Tooltip {...TT} formatter={(v:any)=>[`€${Number(v).toFixed(2)}`,'Ingresos']}/>
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {dowData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Avg ticket trend + Payment methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.3,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-1">Ticket medio por día</p>
          <p className="text-xs text-muted mb-4">Evolución últimos 10 días con datos</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={avgTrend} margin={{top:4,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${v}`}/>
              <Tooltip {...TT} formatter={(v:any)=>[`€${Number(v).toFixed(2)}`,'Ticket medio']}/>
              <Line type="monotone" dataKey="avgTicket" stroke="#F59E0B" strokeWidth={2.5} dot={{fill:'#F59E0B',r:3}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment breakdown */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-4">Métodos de pago</p>
          <div className="space-y-4">
            {byPayment.map((m,i)=>{
              const pct = totalRev>0 ? Math.round((m.revenue/totalRev)*100) : 0
              const color = ['#F59E0B','#22C55E','#60A5FA'][i]
              return (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium text-ink capitalize">{m.name.toLowerCase()}</span>
                    <div className="text-right">
                      <span className="font-semibold text-ink">€{m.revenue.toFixed(2)}</span>
                      <span className="text-muted text-xs ml-2">{m.count} facturas</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${pct}%`}}
                      transition={{delay:.5+i*.1,duration:.8,ease:[.22,1,.36,1]}}
                      className="h-full rounded-full" style={{background:color}}/>
                  </div>
                  <p className="text-xs text-right mt-0.5 font-medium" style={{color}}>{pct}%</p>
                </div>
              )
            })}
          </div>

          {/* IVA summary */}
          <div className="mt-5 pt-4 border-t border-rim grid grid-cols-3 gap-2 text-center text-xs">
            <div><p className="text-muted">Base imp.</p><p className="font-bold text-ink mt-0.5">€{subtotal.toFixed(2)}</p></div>
            <div><p className="text-muted">IVA (21%)</p><p className="font-bold text-amber-400 mt-0.5">€{ivaTotal.toFixed(2)}</p></div>
            <div><p className="text-muted">Total</p><p className="font-bold text-green-400 mt-0.5">€{totalRev.toFixed(2)}</p></div>
          </div>
        </motion.div>
      </div>

      {/* Facturas table */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.45,ease:[.22,1,.36,1]}}
        className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
          <p className="font-semibold text-ink">Facturas recientes</p>
          <span className="text-xs text-muted">Mostrando {Math.min(filtered.length,20)} de {filtered.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-faint text-xs uppercase tracking-wider border-b border-rim bg-surface2">
                <th className="px-5 py-3 text-left font-medium">ID</th>
                <th className="px-3 py-3 text-left font-medium">Pedido</th>
                <th className="px-3 py-3 text-left font-medium hidden md:table-cell">Mesa</th>
                <th className="px-3 py-3 text-left font-medium hidden lg:table-cell">Fecha</th>
                <th className="px-3 py-3 text-left font-medium">Método</th>
                <th className="px-3 py-3 text-right font-medium">IVA</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,20).map((f,i)=>(
                <motion.tr key={f.idFactura} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5+i*.02}}
                  className="border-b border-rim hover:bg-surface2 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-accent">FAC-{f.idFactura}</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted">PED-{f.pedido?.idPedido ?? '—'}</td>
                  <td className="px-3 py-3 font-bold hidden md:table-cell">#{f.pedido?.mesa?.numero ?? '—'}</td>
                  <td className="px-3 py-3 text-xs text-muted hidden lg:table-cell">
                    {f.fechaEmision ? format(parseISO(f.fechaEmision),'dd/MM/yyyy HH:mm') : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`badge border capitalize ${
                      f.metodoPago==='EFECTIVO' ? 'bg-green-500/15 text-green-400 border-green-500/20' :
                      f.metodoPago==='TARJETA'  ? 'bg-accent/15 text-accent border-accent/20' :
                      'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}>
                      {f.metodoPago.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-amber-400">€{f.totalIva.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-bold text-green-400">€{f.total.toFixed(2)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
