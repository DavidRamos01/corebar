import React, { useState, useRef, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, X, Search, Receipt } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { getFacturas, getPedido, getFacturasSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import type { FacturaResponse } from '../api/types'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

const eur = (n: number) =>
  (n ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

/** Código de barras decorativo, generado de forma estable a partir del número de factura. */
function Barcode({ seed }: { seed: number }) {
  let x = (seed * 2654435761) >>> 0
  const rnd = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296 }
  const bars: { x: number; w: number }[] = []
  let pos = 4
  while (pos < 236) {
    const w = rnd() < 0.55 ? 1 : rnd() < 0.7 ? 2 : 3
    bars.push({ x: pos, w })
    pos += w + (rnd() < 0.5 ? 1 : 2)
  }
  return (
    <svg width="240" height="44" viewBox="0 0 240 44" style={{display:'block',margin:'0 auto'}}>
      {bars.map((b, i) => <rect key={i} x={b.x} y="0" width={b.w} height="44" fill="#111" />)}
    </svg>
  )
}

function TicketContent({ factura }: { factura: FacturaResponse }) {
  const p = factura.pedido
  if (!p) return <div style={{padding:24,fontFamily:'monospace',color:'#000'}}>Sin datos de pedido</div>

  const fecha  = factura.fechaEmision ? parseISO(factura.fechaEmision) : new Date()
  const numero = `FAC-${format(fecha, 'yyyy')}-${String(factura.idFactura).padStart(5, '0')}`
  const lineas = (p.detalles ?? []).filter(d => d.estado !== 'CANCELADO')
  const unidades = lineas.reduce((s, d) => s + d.cantidad, 0)
  const base = factura.subtotal ?? 0
  const iva  = factura.totalIva ?? 0
  const tipoIva = base > 0 ? Math.round((iva / base) * 100) : 21
  const metodo = factura.metodoPago.charAt(0) + factura.metodoPago.slice(1).toLowerCase()

  const mono = "'Courier New', ui-monospace, monospace"
  const dash = '1px dashed #9a9a9a'
  const row: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:8 }

  return (
    <div style={{fontFamily:mono,fontSize:12.5,color:'#111',background:'#fff',padding:'26px 24px 18px',width:300,margin:'0 auto',lineHeight:1.35}}>
      {/* Cabecera */}
      <div style={{textAlign:'center'}}>
        <img src="/logo.png" alt="" width={58} height={58} style={{display:'block',margin:'0 auto 8px',borderRadius:'50%'}} />
        <div style={{fontSize:22,fontWeight:700,letterSpacing:4}}>COREBAR</div>
        <div style={{fontSize:10.5,letterSpacing:2,color:'#555',marginBottom:6}}>RESTAURANTE · BAR</div>
        <div style={{fontSize:11,color:'#444'}}>COREBAR HOSTELERÍA S.L.</div>
        <div style={{fontSize:11,color:'#444'}}>C/ Gran Vía 12 · 28013 Madrid</div>
        <div style={{fontSize:11,color:'#444'}}>Tel. 91 234 56 78 · NIF B12345678</div>
        <div style={{fontSize:11,color:'#444'}}>www.corebar.es</div>
      </div>

      <div style={{borderTop:dash,margin:'12px 0 10px'}} />
      <div style={{textAlign:'center',fontWeight:700,letterSpacing:1.5,fontSize:12}}>FACTURA SIMPLIFICADA</div>
      <div style={{textAlign:'center',fontSize:11,color:'#555',marginBottom:8}}>{numero}</div>

      {/* Datos del servicio */}
      <div style={{fontSize:11.5,color:'#333'}}>
        <div style={row}><span>Fecha</span><span>{format(fecha,'dd/MM/yyyy',{locale:es})}</span></div>
        <div style={row}><span>Hora</span><span>{format(fecha,'HH:mm',{locale:es})}</span></div>
        <div style={row}><span>Mesa</span><span>{p.mesa?.numero ?? '—'}</span></div>
        <div style={row}><span>Atendido por</span><span>{p.usuario?.nombre?.split(' ')[0] ?? '—'}</span></div>
        <div style={row}><span>Pedido</span><span>#{p.idPedido}</span></div>
      </div>

      {/* Líneas */}
      <div style={{borderTop:'2px solid #111',margin:'12px 0 0',paddingTop:6}}>
        <div style={{display:'grid',gridTemplateColumns:'26px 1fr 62px',gap:'0 6px',fontSize:11,color:'#666',fontWeight:700,paddingBottom:4,borderBottom:dash}}>
          <span>UD</span><span>DESCRIPCIÓN</span><span style={{textAlign:'right'}}>IMPORTE</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'26px 1fr 62px',gap:'0 6px',paddingTop:6}}>
          {lineas.map((d, i) => (
            <div key={i} style={{display:'contents'}}>
              <span style={{paddingTop:3}}>{d.cantidad}</span>
              <span style={{paddingTop:3,wordBreak:'break-word'}}>
                {d.producto.nombre}
                {d.cantidad > 1 && <span style={{display:'block',fontSize:10.5,color:'#777'}}>{d.cantidad} x {eur(d.precioUnitario)}</span>}
                {d.notas && <span style={{display:'block',fontSize:10.5,color:'#777',fontStyle:'italic'}}>· {d.notas}</span>}
              </span>
              <span style={{paddingTop:3,textAlign:'right'}}>{eur(d.cantidad * d.precioUnitario)}</span>
            </div>
          ))}
        </div>
        <div style={{...row,fontSize:11,color:'#666',marginTop:8,paddingTop:6,borderTop:dash}}>
          <span>{lineas.length} artículo{lineas.length !== 1 ? 's' : ''}</span><span>{unidades} unidad{unidades !== 1 ? 'es' : ''}</span>
        </div>
      </div>

      {/* Total */}
      <div style={{borderTop:'2px solid #111',borderBottom:'2px solid #111',margin:'10px 0',padding:'8px 0',...row,alignItems:'baseline',fontSize:19,fontWeight:700}}>
        <span>TOTAL</span><span>{eur(factura.total)}</span>
      </div>

      {/* Desglose de IVA */}
      <div style={{fontSize:11,color:'#333'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',color:'#666',fontWeight:700,paddingBottom:3,borderBottom:dash}}>
          <span>TIPO IVA</span><span style={{textAlign:'right'}}>BASE</span><span style={{textAlign:'right'}}>CUOTA</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',paddingTop:3}}>
          <span>{tipoIva}%</span><span style={{textAlign:'right'}}>{eur(base)}</span><span style={{textAlign:'right'}}>{eur(iva)}</span>
        </div>
        <div style={{...row,marginTop:6,color:'#666'}}><span>IVA incluido en los precios</span></div>
      </div>

      {/* Pago */}
      <div style={{borderTop:dash,margin:'10px 0 0',paddingTop:8,fontSize:11.5,color:'#333'}}>
        <div style={row}><span>Forma de pago</span><span style={{fontWeight:700}}>{metodo}</span></div>
        <div style={row}><span>Importe pagado</span><span>{eur(factura.total)}</span></div>
        {factura.metodoPago === 'EFECTIVO' && <div style={row}><span>Cambio</span><span>{eur(0)}</span></div>}
      </div>

      {/* Pie */}
      <div style={{textAlign:'center',borderTop:dash,marginTop:12,paddingTop:12}}>
        <div style={{fontWeight:700,letterSpacing:1}}>¡GRACIAS POR SU VISITA!</div>
        <div style={{fontSize:11,color:'#555',marginTop:2}}>Esperamos verle pronto en CoreBar</div>
        <div style={{margin:'12px 0 4px'}}><Barcode seed={factura.idFactura} /></div>
        <div style={{fontSize:10.5,letterSpacing:3,color:'#444'}}>{String(factura.idFactura).padStart(10,'0')}</div>
        <div style={{fontSize:9.5,color:'#888',marginTop:8}}>Factura simplificada · Conserve este ticket</div>
      </div>
    </div>
  )
}

function PrintModal({ factura, onClose }: { factura:FacturaResponse; onClose:()=>void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [fullFactura, setFullFactura] = useState<FacturaResponse>(factura)
  const [loadingPedido, setLoadingPedido] = useState(true)

  useEffect(() => {
    const idPedido = factura.pedido?.idPedido
    if (!idPedido) { setLoadingPedido(false); return }
    getPedido(idPedido)
      .then(pedido => setFullFactura({ ...factura, pedido }))
      .catch(() => {})
      .finally(() => setLoadingPedido(false))
  }, [factura.idFactura])

  const handlePrint = () => {
    const el = ref.current; if (!el) return
    const orig = document.body.innerHTML
    document.body.innerHTML = `<div id="print-area">${el.innerHTML}</div>`
    window.print()
    document.body.innerHTML = orig
    window.location.reload()
  }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,y:24,scale:.94}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:24,scale:.94}}
        transition={{duration:.25,ease:[.22,1,.36,1]}} onClick={e=>e.stopPropagation()}
        className="bg-surface border border-rim rounded-xl shadow-2xl overflow-hidden w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-accent"/>
            <p className="font-semibold text-ink">Factura FAC-{factura.idFactura}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface2 hover:bg-rim flex items-center justify-center text-muted hover:text-ink transition-colors">
            <X size={15}/>
          </button>
        </div>
        <div className="p-5 flex justify-center bg-surface2 overflow-y-auto max-h-[70vh]">
          <div style={{filter:'drop-shadow(0 10px 16px rgba(0,0,0,.45))'}}>
            <div ref={ref} style={{
              paddingBottom:12, background:'#fff',
              WebkitMask:'conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) 50% / 14px 100%',
              mask:'conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) 50% / 14px 100%',
            }}>
              {loadingPedido
                ? <div style={{padding:32,fontFamily:'monospace',color:'#000',background:'#fff',width:300,textAlign:'center'}}>Cargando...</div>
                : <TicketContent factura={fullFactura}/>
              }
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-rim">
          <button className="btn-ghost flex-1" onClick={onClose}><X size={14}/> Cerrar</button>
          <button className="btn-primary flex-1" onClick={handlePrint}><Printer size={14}/> Imprimir</button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Tickets() {
  const { data:facturas, loading, error, refetch } = useAsync(getFacturas, [], getFacturasSync)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<FacturaResponse|null>(null)
  const [page,     setPage]     = useState(0)
  const PER_PAGE = 16

  const filtered = useMemo(()=>(facturas??[]).filter(f=>
    `FAC-${f.idFactura}`.includes(search) ||
    String(f.pedido?.mesa?.numero ?? '').includes(search) ||
    f.metodoPago.toLowerCase().includes(search.toLowerCase()) ||
    (f.pedido?.usuario?.nombre?.toLowerCase().includes(search.toLowerCase())??false)
  ), [facturas, search])

  const paginated = filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE)
  const pages     = Math.ceil(filtered.length/PER_PAGE)

  const totalRev   = (facturas??[]).reduce((s,f)=>s+(f.total??0),0)
  const totalIva   = (facturas??[]).reduce((s,f)=>s+(f.totalIva??0),0)

  const byPayment = (['EFECTIVO','TARJETA','BIZUM'] as const).map((m,i)=>({
    name:m.toLowerCase(), value:(facturas??[]).filter(f=>f.metodoPago===m).length,
    color:['#F59E0B','#22C55E','#60A5FA'][i],
  }))

  // Daily tickets chart
  const dailyMap: Record<string,number> = {}
  ;(facturas??[]).forEach(f=>{
    const d = f.fechaEmision ? format(parseISO(f.fechaEmision),'dd/MM') : 'Hoy'
    dailyMap[d]=(dailyMap[d]??0)+1
  })
  const dailyData = Object.entries(dailyMap).slice(-10).map(([date,count])=>({date,count}))

  if (loading) return <Spinner/>
  if (error)   return <ErrorBanner message={error} onRetry={refetch}/>

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Total facturas',  value:facturas?.length??0,       color:'text-accent'},
          {label:'Ingresos totales',value:`€${totalRev.toFixed(2)}`, color:'text-green-400'},
          {label:'IVA total',       value:`€${totalIva.toFixed(2)}`, color:'text-amber-400'},
          {label:'Ticket medio',    value:`€${(totalRev/(facturas?.length||1)).toFixed(2)}`, color:'text-muted'},
        ].map((c,i)=>(
          <motion.div key={c.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06,duration:.25,ease:[.22,1,.36,1]}}
            className="card p-4">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-[22px] font-bold tabular-nums leading-none ${c.color}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-3">Facturas por día</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData} margin={{top:0,right:4,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e7f5" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#9faac2',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT} formatter={(v:any)=>[v,'Facturas']}/>
              <Bar dataKey="count" fill="#F59E0B" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.25,duration:.45,ease:[.22,1,.36,1]}}
          className="card p-5">
          <p className="font-semibold text-ink mb-3">Métodos de pago</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={byPayment} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={3}>
                  {byPayment.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
                </Pie>
                <Tooltip {...TT} formatter={(v:any,_:string,p:any)=>[v,p.payload.name]}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {byPayment.map(m=>(
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{background:m.color}}/>
                    <span className="capitalize text-ink">{m.name}</span>
                  </div>
                  <span className="font-semibold text-muted">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 text-faint"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}
            className="input input-icon w-full h-9 text-sm" placeholder="Buscar factura"/>
        </div>
        <p className="text-xs text-muted">{filtered.length} facturas</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginated.map((f,i)=>(
          <motion.div key={f.idFactura}
            initial={{opacity:0,y:16,scale:.97}} animate={{opacity:1,y:0,scale:1}}
            transition={{delay:.1+i*.03,duration:.4,ease:[.22,1,.36,1]}}
            className="card-hover p-4 cursor-pointer group" onClick={()=>setSelected(f)}>
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-sm text-ink">Mesa {f.pedido?.mesa?.numero ?? '—'}</p>
              <span className="font-mono text-[10px] text-faint">FAC-{f.idFactura}</span>
            </div>
            <p className="text-xs text-faint mb-2">
              {f.pedido?.usuario?.nombre?.split(' ')[0] ?? '—'}
              {f.fechaEmision ? ` · ${format(parseISO(f.fechaEmision),'dd/MM HH:mm')}` : ''}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-green-400">€{f.total.toFixed(2)}</p>
              <span className={`badge border text-[10px] capitalize ${
                f.metodoPago==='EFECTIVO' ? 'bg-green-500/15 text-green-400 border-green-500/20' :
                f.metodoPago==='TARJETA'  ? 'bg-accent/15 text-accent border-accent/20' :
                'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}>
                {f.metodoPago.toLowerCase()}
              </span>
            </div>
            <button className="mt-3 w-full btn-ghost h-8 text-xs flex items-center justify-center gap-1.5 group-hover:border-accent group-hover:text-accent transition-colors">
              <Printer size={11}/> Imprimir ticket
            </button>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {pages>1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">Página {page+1} de {pages}</p>
          <div className="flex gap-2">
            <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="btn-ghost h-8 px-3 text-xs disabled:opacity-40">Anterior</button>
            {Array.from({length:Math.min(pages,5)},(_,i)=>(
              <button key={i} onClick={()=>setPage(i)}
                className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${page===i?'bg-accent text-bg font-bold':'bg-surface2 text-muted border border-rim'}`}>{i+1}</button>
            ))}
            <button disabled={page===pages-1} onClick={()=>setPage(p=>p+1)} className="btn-ghost h-8 px-3 text-xs disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {selected && <PrintModal factura={selected} onClose={()=>setSelected(null)}/>}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
