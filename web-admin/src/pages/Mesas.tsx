import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, CheckCircle, Plus, Trash2, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { getMesas, getPedidos, updateMesaEstado, createMesa, deleteMesa, getMesasSync, getPedidosSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import type { MesaResponse, PedidoResponse } from '../api/types'
import { Portal } from '../components/Portal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useToast, errMsg } from '../context/ToastContext'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

const ESTADO_STYLE: Record<string,string> = {
  LIBRE:     'border-rim/60 bg-surface shadow-md shadow-black/5 hover:border-accent/30',
  OCUPADA:   'border-green-500/25 bg-surface shadow-md shadow-black/5',
  RESERVADA: 'border-amber-500/30 bg-surface shadow-md shadow-black/5',
}
const ESTADO_BADGE: Record<string,string> = {
  LIBRE:     'bg-surface2 text-muted border-rim',
  OCUPADA:   'bg-green-500/15 text-green-400 border-green-500/20',
  RESERVADA: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

export default function Mesas() {
  const { data:mesas,   loading:lM, error:eM, refetch:rM } = useAsync(getMesas, [], getMesasSync)
  const { data:pedidos, loading:lP }                        = useAsync(()=>getPedidos({estado:'ABIERTO'}), [], ()=>getPedidosSync({estado:'ABIERTO'}))
  const [detail,    setDetail]    = useState<MesaResponse|null>(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [newMesa,   setNewMesa]   = useState({ capacidad:'4' })
  const [changing,  setChanging]  = useState<number|null>(null)
  const [capErr,    setCapErr]    = useState('')
  const [delMesa,   setDelMesa]   = useState<MesaResponse|null>(null)
  const toast = useToast()

  const openPedido = (idMesa:number) => pedidos?.find(p=>p.mesa?.idMesa===idMesa) ?? null

  const handleEstado = async (id:number, estado:string) => {
    setChanging(id)
    try { await updateMesaEstado(id, estado); rM(); toast.success(`Mesa marcada como ${estado.toLowerCase()}.`) }
    catch (err) { toast.error(errMsg(err, 'No se pudo cambiar el estado de la mesa.')) }
    finally { setChanging(null) }
  }

  const handleCreate = async () => {
    const nextNumero = mesas && mesas.length > 0
      ? Math.max(...mesas.map(m => m.numero)) + 1
      : 1
    const cap = Number(newMesa.capacidad)
    if (newMesa.capacidad.trim() === '') { setCapErr('Indica la capacidad.'); return }
    if (!Number.isInteger(cap) || cap < 1 || cap > 50) { setCapErr('La capacidad debe ser un número entero entre 1 y 50.'); return }
    setCapErr('')
    try {
      await createMesa({ numero: nextNumero, capacidad: cap, estado: 'LIBRE', posX: 0, posY: 0 })
      rM(); setShowAdd(false); setNewMesa({ capacidad: '4' })
      toast.success(`Mesa ${nextNumero} creada correctamente.`)
    } catch (err) { toast.error(errMsg(err, 'No se pudo crear la mesa.')) }
  }

  const handleDelete = async (m:MesaResponse) => {
    try {
      await deleteMesa(m.idMesa); rM(); setDetail(null)
      toast.success(`Mesa ${m.numero} eliminada.`)
    } catch (err) { toast.error(errMsg(err, 'No se pudo eliminar la mesa. Puede que tenga pedidos asociados.')) }
  }

  const libre     = mesas?.filter(m=>m.estado==='LIBRE').length ?? 0
  const ocupada   = mesas?.filter(m=>m.estado==='OCUPADA').length ?? 0
  const donutData = [
    {name:'Libres',     value:libre,     color:'#22C55E'},
    {name:'Ocupadas',   value:ocupada,   color:'#F59E0B'},
  ]

  if (lM||lP) return <Spinner/>
  if (eM)     return <ErrorBanner message={eM} onRetry={rM}/>

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Donut */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1,duration:.4,ease:[.22,1,.36,1]}}
          className="card p-5 flex items-center gap-4">
          <ResponsiveContainer width={90} height={90}>
            <PieChart>
              <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={24} outerRadius={40} paddingAngle={3}>
                {donutData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
              </Pie>
              <Tooltip {...TT} formatter={(v:any,_:string,p:any)=>[v,p.payload.name]}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 text-sm">
            {donutData.map(d=>(
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{background:d.color}}/>
                <span className="text-muted">{d.name}</span>
                <span className="font-bold ml-auto" style={{color:d.color}}>{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* KPIs */}
        {[
          {label:'Total mesas',      value:mesas?.length??0,  color:'text-ink'},
          {label:'Ocupación',        value:`${mesas?.length ? Math.round(ocupada/mesas.length*100) : 0}%`, color:'text-accent'},
          {label:'Pedidos abiertos', value:pedidos?.length??0, color:'text-green-400'},
        ].map((c,i)=>(
          <motion.div key={c.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.12+i*.06,duration:.25,ease:[.22,1,.36,1]}}
            className="card p-4">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-[28px] font-bold tabular-nums leading-none ${c.color}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Haz clic en una mesa para ver detalles o cambiar estado</p>
        <div className="flex gap-2">
          <button onClick={rM} className="btn-ghost h-9 px-3"><RefreshCw size={14}/></button>
          <button onClick={()=>setShowAdd(true)} className="btn-primary h-9"><Plus size={15}/> Nueva mesa</button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
        {(mesas??[]).map((mesa,i)=>{
          const pedido = openPedido(mesa.idMesa)
          return (
            <motion.div key={mesa.idMesa}
              initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.15+i*.03,duration:.35,ease:[.22,1,.36,1]}}
              whileHover={{y:-2,scale:1.02}} whileTap={{scale:.97}}
              onClick={()=>setDetail(mesa)}
              className={`relative cursor-pointer rounded-2xl border p-4 transition-colors ${ESTADO_STYLE[mesa.estado]}`}>
              {mesa.estado==='OCUPADA' && (
                <motion.div animate={{scale:[1,1.3,1]}} transition={{repeat:Infinity,duration:2}}
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-green-400"/>
              )}
              {mesa.estado==='RESERVADA' && (
                <motion.div animate={{scale:[1,1.3,1]}} transition={{repeat:Infinity,duration:2.5}}
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400"/>
              )}
              <p className="text-2xl font-black text-ink">#{mesa.numero}</p>
              <div className="flex items-center gap-1 text-xs text-muted my-1.5">
                <Users size={11}/><span>{mesa.capacidad}p</span>
              </div>
              <span className={`badge border text-[10px] capitalize ${ESTADO_BADGE[mesa.estado]}`}>
                {mesa.estado.toLowerCase()}
              </span>
              {pedido && (
                <p className="text-[10px] text-green-400 font-semibold mt-1">€{pedido.total.toFixed(2)}</p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        {[
          {color:'border-rim/60 bg-surface shadow-sm',        label:'Libre'},
          {color:'border-green-500/25 bg-surface shadow-sm', label:'Ocupada (pedido activo)'},
        ].map(l=>(
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded border ${l.color}`}/>
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (() => {
          const pedido = openPedido(detail.idMesa)
          return (
            <Portal><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={()=>setDetail(null)}>
              <motion.div initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.92}}
                onClick={e=>e.stopPropagation()}
                className="bg-surface border border-rim rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-xl text-ink">Mesa {detail.numero}</p>
                    <p className="text-xs text-muted">{detail.capacidad} personas · <span className="capitalize">{detail.estado.toLowerCase()}</span></p>
                  </div>
                  <button onClick={()=>setDetail(null)} className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-muted hover:text-ink"><X size={15}/></button>
                </div>

                {/* Estado buttons */}
                <div className="flex gap-2 mb-4">
                  {(['LIBRE','OCUPADA'] as const).map(s=>(
                    <button key={s} onClick={()=>handleEstado(detail.idMesa,s)} disabled={changing===detail.idMesa||detail.estado===s}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 capitalize ${
                        detail.estado===s ? `${ESTADO_BADGE[s]} cursor-default` : 'bg-surface2 text-muted border-rim hover:text-ink'
                      }`}>{s.toLowerCase()}</button>
                  ))}
                </div>

                {pedido ? (
                  <>
                    <p className="text-sm font-semibold text-ink mb-2">Pedido #{pedido.idPedido}</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {(pedido.detalles??[]).map(d=>(
                        <div key={d.idDetallePedido} className="flex justify-between text-sm py-1.5 border-b border-rim/40">
                          <span className="text-ink">{d.producto.nombre} <span className="text-muted">×{d.cantidad}</span></span>
                          <span className="text-ink">€{(d.cantidad*d.precioUnitario).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-rim">
                      <span className="font-bold text-ink">Total</span>
                      <span className="text-xl font-bold text-green-400">€{pedido.total.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6 text-muted">
                    <CheckCircle size={32} className="mb-2 text-green-500/40"/>
                    <p className="font-medium text-ink">Sin pedido activo</p>
                  </div>
                )}

                <button onClick={()=>setDelMesa(detail)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={13}/> Eliminar mesa
                </button>
              </motion.div>
            </div></Portal>
          )
        })()}
      </AnimatePresence>

      <ConfirmDialog
        open={delMesa !== null}
        title="Eliminar mesa"
        message={`¿Seguro que quieres eliminar la mesa ${delMesa?.numero ?? ''}? Esta acción no se puede deshacer.`}
        onConfirm={async () => { if (delMesa) await handleDelete(delMesa); setDelMesa(null) }}
        onCancel={() => setDelMesa(null)}
      />

      {/* Add modal */}
      {showAdd && (
        <Portal><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={()=>setShowAdd(false)}>
          <motion.div initial={{opacity:0,scale:.93}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.93}}
            onClick={e=>e.stopPropagation()}
            className="bg-surface border border-rim rounded-xl p-6 w-full max-w-xs shadow-2xl">
            <p className="font-bold text-lg text-ink mb-1">Nueva mesa</p>
            <p className="text-xs text-muted mb-5">
              Nº asignado automáticamente: <span className="font-semibold text-ink">
                {mesas && mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1}
              </span>
            </p>
            <div className="space-y-3">
              <div><label className="text-xs text-muted block mb-1">Capacidad (personas)</label>
                <input type="number" min="1" value={newMesa.capacidad} onChange={e=>{setNewMesa(m=>({...m,capacidad:e.target.value})); if(capErr) setCapErr('')}} className={'input w-full'+(capErr?' input-error':'')} aria-invalid={!!capErr}/>{capErr && <p className="field-error" role="alert">{capErr}</p>}</div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-ghost flex-1" onClick={()=>{setShowAdd(false);setCapErr('')}}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={handleCreate}>Crear</button>
            </div>
          </motion.div>
        </div></Portal>
      )}
    </div>
  )
}
