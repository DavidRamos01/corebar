import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, Search, TrendingDown, Edit2, Check, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { getProductos, updateStock, marcarAgotado, getProductosSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { InlineSpinner } from '../components/Spinner'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { ProductoResponse } from '../api/types'
import { Portal } from '../components/Portal'
import { useToast, errMsg } from '../context/ToastContext'

type Filter = 'todos' | 'critico' | 'bajo' | 'ok'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

export default function Stock() {
  const { data: productos, loading, error, refetch } = useAsync(getProductos, [], getProductosSync)

  const [search,        setSearch]        = useState('')
  const [catFilt,       setCatFilt]       = useState('Todas')
  const [filter,        setFilter]        = useState<Filter>('todos')
  const [editId,        setEditId]        = useState<number | null>(null)
  const [editVal,       setEditVal]       = useState('')
  const [saving,        setSaving]        = useState(false)
  const [showStockEdit, setShowStockEdit] = useState(false)
  const [stockSelId,    setStockSelId]    = useState<string>('')
  const [stockSelVal,   setStockSelVal]   = useState('')
  const [stockSaving,   setStockSaving]   = useState(false)
  const [agotadoId,     setAgotadoId]     = useState<number|null>(null)
  const [agotadoName,   setAgotadoName]   = useState('')
  const [editErr,       setEditErr]       = useState('')
  const [modalErrs,     setModalErrs]     = useState<{prod?:string; val?:string}>({})
  const toast = useToast()
  const isEntero = (v: string) => /^\d+$/.test(v.trim())

  const filtered = useMemo(() => {
    return (productos ?? []).filter(p => {
      const matchCat = catFilt === 'Todas' || p.categoria?.nombre === catFilt
      const matchQ   = p.nombre.toLowerCase().includes(search.toLowerCase())
      const matchF   = filter === 'todos'   ? true
                     : filter === 'critico' ? p.stockActual <= 5
                     : filter === 'bajo'    ? p.stockActual > 5 && p.stockActual <= 20
                     : p.stockActual > 20
      return matchCat && matchQ && matchF
    }).sort((a, b) => a.stockActual - b.stockActual || a.nombre.localeCompare(b.nombre))
  }, [productos, search, catFilt, filter])

  const critical  = productos?.filter(p => p.stockActual <= 5).length ?? 0
  const low       = productos?.filter(p => p.stockActual > 5 && p.stockActual <= 20).length ?? 0
  const ok        = productos?.filter(p => p.stockActual > 20).length ?? 0
  const catNames  = ['Todas', ...Array.from(new Set((productos ?? []).filter(p=>p.categoria).map(p => p.categoria.nombre)))]

  // Chart: top 10 by stock
  const chartData = useMemo(() =>
    [...(productos ?? [])].sort((a, b) => a.stockActual - b.stockActual).slice(0, 10)
      .map(p => ({ name: p.nombre, stock: p.stockActual }))
  , [productos])

  const saveStock = async (id: number) => {
    if (!isEntero(editVal)) { setEditErr('Número entero, 0 o más.'); return }
    const val = parseInt(editVal)
    setEditErr(''); setSaving(true)
    try { await updateStock(id, val); refetch(); setEditId(null); toast.success('Stock actualizado.') }
    catch (err) { toast.error(errMsg(err, 'No se pudo actualizar el stock.')) }
    finally { setSaving(false) }
  }

  const handleMarcarAgotado = async (id: number) => {
    try { await marcarAgotado(id); refetch(); toast.success('Producto marcado como agotado.') }
    catch (err) { toast.error(errMsg(err, 'No se pudo marcar el producto como agotado.')) }
  }

  const handleStockEditSave = async () => {
    const id  = parseInt(stockSelId)
    const errs: {prod?:string; val?:string} = {}
    if (!id) errs.prod = 'Elige un producto.'
    if (stockSelVal.trim() === '') errs.val = 'Indica la cantidad.'
    else if (!isEntero(stockSelVal)) errs.val = 'Número entero, 0 o más.'
    setModalErrs(errs)
    if (errs.prod || errs.val) return
    const val = parseInt(stockSelVal)
    setStockSaving(true)
    try { await updateStock(id, val); refetch(); setShowStockEdit(false); setStockSelId(''); setStockSelVal(''); toast.success('Stock actualizado.') }
    catch (err) { toast.error(errMsg(err, 'No se pudo actualizar el stock.')) }
    finally { setStockSaving(false) }
  }

  if (loading) return <Spinner />
  if (error)   return <ErrorBanner message={error} onRetry={refetch} />

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total productos',  value: productos?.length ?? 0, icon: Package,       iconColor: 'text-accent'    },
          { label: 'Stock crítico ≤5', value: critical,               icon: AlertTriangle, iconColor: 'text-red-400'   },
          { label: 'Stock bajo ≤20',   value: low,                    icon: TrendingDown,  iconColor: 'text-amber-400' },
          { label: 'Stock OK',         value: ok,                     icon: Package,       iconColor: 'text-green-400' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06, duration: .25, ease: [.22, 1, .36, 1] }}
            className="card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <c.icon size={12} className={c.iconColor} />
              <p className="text-[11px] font-semibold text-faint uppercase tracking-wider">{c.label}</p>
            </div>
            <p className="text-[26px] font-bold text-ink tabular-nums leading-none">{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Stock chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .4, ease: [.22, 1, .36, 1] }}
        className="card p-5">
        <p className="font-semibold text-ink mb-1">Productos con menos stock</p>
        <p className="text-xs text-muted mb-4">Los 10 con menor cantidad disponible</p>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 26)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: '#9faac2', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fill: 'var(--c-ink)', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
            <Tooltip {...TT} />
            <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={d.stock <= 5 ? '#EF4444' : d.stock <= 20 ? '#F59E0B' : '#22C55E'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .4 }} className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center flex-1 min-w-48">
            <Search size={14} className="absolute left-3 text-faint" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input input-icon w-full h-9 text-sm" placeholder="Buscar producto" />
          </div>
          <select value={catFilt} onChange={e => setCatFilt(e.target.value)} className="input h-9 text-sm pr-8">
            {catNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-2">
            {([['todos','Todos','bg-surface2 border-rim text-ink'],
               ['critico','Crítico ·'+critical,'bg-red-500/15 border-red-500/20 text-red-400'],
               ['bajo','Bajo ·'+low,'bg-amber-500/15 border-amber-500/20 text-amber-400'],
               ['ok','OK ·'+ok,'bg-green-500/15 border-green-500/20 text-green-400']] as const).map(([k,l,c])=>(
              <button key={k} onClick={() => setFilter(k as Filter)}
                className={`badge border cursor-pointer transition-all ${c} ${filter===k?'ring-1 ring-current':''}`}>{l}</button>
            ))}
          </div>
          <button onClick={() => { setShowStockEdit(true); setStockSelId(''); setStockSelVal(''); setModalErrs({}) }} className="btn-primary ml-auto">
            <Edit2 size={15} /> Ajustar stock
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .45, ease: [.22, 1, .36, 1] }}
        className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-faint text-xs uppercase tracking-wider border-b border-rim bg-surface2">
              <th className="px-5 py-3.5 text-left font-medium">Producto</th>
              <th className="px-3 py-3.5 text-left font-medium hidden sm:table-cell">Cat.</th>
              <th className="px-3 py-3.5 text-center font-medium">Stock</th>
              <th className="px-3 py-3.5 text-right font-medium">Precio</th>
              <th className="px-3 py-3.5 text-center font-medium">IVA</th>
              <th className="px-3 py-3.5 text-center font-medium">Estado</th>
              <th className="px-3 py-3.5 text-center font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const isCrit = p.stockActual <= 5
              const isLow  = p.stockActual > 5 && p.stockActual <= 20
              return (
                <motion.tr key={p.idProducto} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .35 + i * .02 }}
                  className="border-b border-rim hover:bg-surface2 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {p.imagenUrl
                        ? <img src={p.imagenUrl} alt={p.nombre}
                            className="w-8 h-8 rounded-lg object-contain border border-rim bg-surface2 flex-shrink-0"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                        : <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCrit ? 'bg-red-500/15' : isLow ? 'bg-amber-500/15' : 'bg-green-500/10'}`}>
                            <Package size={13} className={isCrit ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-green-400'} />
                          </div>
                      }
                      <span className="font-medium text-ink">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className="badge bg-surface2 text-muted border border-rim">{p.categoria?.nombre ?? '—'}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {editId === p.idProducto ? (
                      <div className="flex items-center gap-1 justify-center">
                        <input type="number" value={editVal} onChange={e => { setEditVal(e.target.value); if (editErr) setEditErr('') }}
                          className={'input w-16 h-7 text-center text-xs px-2' + (editErr ? ' input-error' : '')} autoFocus title={editErr || undefined}/>
                        <button onClick={() => saveStock(p.idProducto)} disabled={saving} className="text-green-400 hover:text-green-300">
                          {saving ? <InlineSpinner/> : <Check size={14}/>}
                        </button>
                        <button onClick={() => { setEditId(null); setEditErr('') }} className="text-muted hover:text-ink"><X size={14}/></button>
                        {editErr && <span className="field-error mt-0 ml-1" role="alert">{editErr}</span>}
                      </div>
                    ) : (
                      <span className={`font-bold text-lg ${isCrit ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-green-400'}`}>
                        {p.stockActual}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">€{p.precio.toFixed(2)}</td>
                  <td className="px-3 py-3 text-center text-muted text-xs">{p.porcentajeIva}%</td>
                  <td className="px-3 py-3 text-center">
                    {isCrit ? <span className="badge bg-red-500/15 text-red-400">Crítico</span>
                      : isLow ? <span className="badge bg-amber-500/15 text-amber-400">Bajo</span>
                      : <span className="badge bg-green-500/15 text-green-400">OK</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditId(p.idProducto); setEditVal(String(p.stockActual)) }}
                        className="w-7 h-7 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors" title="Editar stock">
                        <Edit2 size={12}/>
                      </button>
                      <button onClick={() => { setAgotadoId(p.idProducto); setAgotadoName(p.nombre) }}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors" title="Marcar agotado">
                        <X size={12}/>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Adjust stock modal */}
      {showStockEdit && (
        <Portal><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => { setShowStockEdit(false); setModalErrs({}) }}>
          <motion.div initial={{ opacity: 0, scale: .93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .93 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-rim rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <p className="font-bold text-lg text-ink mb-5">Ajustar stock</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Producto *</label>
                <select value={stockSelId} onChange={e => {
                  setStockSelId(e.target.value)
                  setModalErrs(m => ({...m, prod: undefined}))
                  const p = (productos ?? []).find(p => String(p.idProducto) === e.target.value)
                  setStockSelVal(p ? String(p.stockActual) : '')
                }} className={'input w-full pr-8' + (modalErrs.prod ? ' input-error' : '')}>
                  <option value="">Seleccionar producto…</option>
                  {(productos ?? []).sort((a,b) => a.nombre.localeCompare(b.nombre)).map(p => (
                    <option key={p.idProducto} value={p.idProducto}>{p.nombre} (actual: {p.stockActual})</option>
                  ))}
                </select>
                {modalErrs.prod && <p className="field-error" role="alert">{modalErrs.prod}</p>}
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Nuevo stock *</label>
                <input type="number" min="0" value={stockSelVal} onChange={e => { setStockSelVal(e.target.value); setModalErrs(m => ({...m, val: undefined})) }}
                  className={'input w-full' + (modalErrs.val ? ' input-error' : '')} placeholder="Cantidad"/>
                {modalErrs.val && <p className="field-error" role="alert">{modalErrs.val}</p>}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-ghost flex-1" onClick={() => { setShowStockEdit(false); setModalErrs({}) }}>Cancelar</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleStockEditSave} disabled={stockSaving}>
                {stockSaving ? <InlineSpinner/> : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </div></Portal>
      )}

      <ConfirmDialog
        open={agotadoId !== null}
        title="Marcar como agotado"
        message={`¿Poner el stock de "${agotadoName}" a 0? El producto quedará sin stock.`}
        confirmLabel="Marcar agotado"
        onConfirm={async () => { if (agotadoId) await handleMarcarAgotado(agotadoId); setAgotadoId(null) }}
        onCancel={() => setAgotadoId(null)}
      />
    </div>
  )
}
