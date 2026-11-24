import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, UtensilsCrossed, Upload, ImageOff } from 'lucide-react'
import { AlertTriangle, Tag, TrendingUp } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useDataVersion } from '../hooks/useDataVersion'
import { getProductos, getCategorias, createProducto, updateProducto, deleteProducto, uploadImagen, getProductosSync, getCategoriasSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { ProductoResponse } from '../api/types'
import { Portal } from '../components/Portal'
import { useToast, errMsg } from '../context/ToastContext'

const COLORS = ['#F59E0B','#22C55E','#60A5FA','#EF4444','#06B6D4','#EC4899','#8B5CF6','#F97316']
const S3_BASE = 'https://img-platos.s3.eu-north-1.amazonaws.com/'

type FormProduct = { nombre:string; descripcion:string; precio:string; stockActual:string; porcentajeIva:string; idCategoria:string; imagenUrl:string }
const emptyForm: FormProduct = { nombre:'', descripcion:'', precio:'', stockActual:'0', porcentajeIva:'21', idCategoria:'', imagenUrl:'' }

function ProductModal({ product, categorias, onClose, onSave }: {
  product: ProductoResponse|null; categorias: {idCategoria:number;nombre:string}[];
  onClose:()=>void; onSave:(f:FormProduct)=>Promise<boolean>
}) {
  const [form, setForm] = useState<FormProduct>(
    product ? { nombre:product.nombre, descripcion:product.descripcion??'', precio:String(product.precio),
      stockActual:String(product.stockActual), porcentajeIva:String(product.porcentajeIva),
      idCategoria:String(product.categoria?.idCategoria ?? ''), imagenUrl:product.imagenUrl??'' } : emptyForm
  )
  const [previewUrl,  setPreviewUrl]  = useState<string>(product?.imagenUrl ?? '')
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [errors,      setErrors]      = useState<Record<string,string>>({})
  const [saving,      setSaving]      = useState(false)

  const setField = (k: keyof FormProduct, v: string) => {
    setForm(f=>({...f,[k]:v}))
    if (errors[k]) setErrors(e=>{ const n={...e}; delete n[k]; return n })
  }
  const cls = (k: string) => 'input w-full' + (errors[k] ? ' input-error' : '')
  const fieldErr = (k: string) => errors[k] ? <p className="field-error" role="alert">{errors[k]}</p> : null

  const validate = (): Record<string,string> => {
    const e: Record<string,string> = {}
    if (!form.nombre.trim()) e.nombre = 'Escribe el nombre del producto.'
    else if (form.nombre.trim().length > 150) e.nombre = 'El nombre no puede pasar de 150 caracteres.'
    const precio = parseFloat(form.precio)
    if (form.precio.trim() === '') e.precio = 'Indica el precio.'
    else if (isNaN(precio) || precio <= 0) e.precio = 'El precio debe ser mayor que 0.'
    if (form.stockActual.trim() !== '' && (!/^\d+$/.test(form.stockActual.trim()))) e.stockActual = 'El stock debe ser un número entero, 0 o más.'
    const iva = Number(form.porcentajeIva)
    if (form.porcentajeIva.trim() === '' || isNaN(iva) || iva < 0 || iva > 100) e.porcentajeIva = 'El IVA debe estar entre 0 y 100.'
    if (!form.idCategoria) e.idCategoria = 'Elige una categoría.'
    return e
  }

  const submit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    const ok = await onSave(form)
    if (!ok) setSaving(false)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
    setUploadError('')
    setUploading(true)
    try {
      const url = await uploadImagen(file)
      setForm(f => ({ ...f, imagenUrl: url }))
    } catch {
      setUploadError('Error al subir imagen. Inténtalo de nuevo.')
      setForm(f => ({ ...f, imagenUrl: '' }))
    } finally {
      setUploading(false)
    }
  }

  const filename = form.imagenUrl.startsWith(S3_BASE) ? form.imagenUrl.slice(S3_BASE.length) : form.imagenUrl ? form.imagenUrl.split('/').pop() ?? '' : ''

  return (
    <Portal><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,scale:.93}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.93}}
        onClick={e=>e.stopPropagation()}
        className="bg-surface border border-rim rounded-xl p-6 w-full max-w-md shadow-2xl">
        <p className="font-bold text-lg text-ink mb-5">{product ? 'Editar producto' : 'Nuevo producto'}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-xs text-muted block mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e=>setField('nombre',e.target.value)} className={cls('nombre')} aria-invalid={!!errors.nombre}/>{fieldErr('nombre')}</div>
          <div><label className="text-xs text-muted block mb-1">Precio (€) *</label>
            <input type="number" step="0.01" value={form.precio} onChange={e=>setField('precio',e.target.value)} className={cls('precio')} aria-invalid={!!errors.precio}/>{fieldErr('precio')}</div>
          <div><label className="text-xs text-muted block mb-1">Stock</label>
            <input type="number" value={form.stockActual} onChange={e=>setField('stockActual',e.target.value)} className={cls('stockActual')} aria-invalid={!!errors.stockActual}/>{fieldErr('stockActual')}</div>
          <div><label className="text-xs text-muted block mb-1">IVA (%)</label>
            <input type="number" value={form.porcentajeIva} onChange={e=>setField('porcentajeIva',e.target.value)} className={cls('porcentajeIva')} aria-invalid={!!errors.porcentajeIva}/>{fieldErr('porcentajeIva')}</div>
          <div><label className="text-xs text-muted block mb-1">Categoría *</label>
            <select value={form.idCategoria} onChange={e=>setField('idCategoria',e.target.value)} className={cls('idCategoria')+' pr-8'} aria-invalid={!!errors.idCategoria}>
              <option value="">Seleccionar…</option>
              {categorias.map(c=><option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
            </select>{fieldErr('idCategoria')}</div>
          <div className="col-span-2"><label className="text-xs text-muted block mb-1">Descripción</label>
            <input value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} className="input w-full" placeholder="Opcional"/></div>
          <div className="col-span-2">
            <label className="text-xs text-muted block mb-1">Imagen</label>
            <label className={`flex items-center gap-2.5 cursor-pointer input w-full h-9 px-3 text-sm transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading
                ? <svg className="animate-spin flex-shrink-0 text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                : <Upload size={12} className="flex-shrink-0 text-faint"/>
              }
              <span className="truncate flex-1 text-faint text-xs">
                {uploading ? 'Subiendo' : filename || 'Seleccionar imagen'}
              </span>
              {filename && !uploading && (
                <button type="button" onClick={e=>{e.preventDefault();setForm(f=>({...f,imagenUrl:''}));setPreviewUrl('');setUploadError('')}}
                  className="text-faint hover:text-red-400 transition-colors flex-shrink-0">
                  <ImageOff size={13}/>
                </button>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading}/>
            </label>
            {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
            {previewUrl && !uploadError && (
              <div className="mt-2 flex items-center gap-3">
                <img src={previewUrl} alt="" className="h-16 w-16 object-contain rounded-lg border border-rim bg-surface2"
                  onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
                {form.imagenUrl && <p className="text-[10px] text-faint break-all leading-relaxed">{form.imagenUrl}</p>}
              </div>
            )}
          </div>
        </div>
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-400 mt-4" role="alert">Revisa los campos marcados en rojo antes de guardar.</p>
        )}
        <div className="flex gap-3 mt-5">
          <button className="btn-ghost flex-1" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary flex-1 justify-center disabled:opacity-60" onClick={submit} disabled={saving||uploading}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </motion.div>
    </div></Portal>
  )
}

export default function Productos() {
  const { data:productos, loading, error, refetch } = useAsync(getProductos, [], getProductosSync)
  const { data:categorias } = useAsync(getCategorias, [], getCategoriasSync)
  const imgV = useDataVersion()
  const toast = useToast()
  const [search,     setSearch]     = useState('')
  const [catFilt,    setCatFilt]    = useState('Todas')
  const [editing,    setEditing]    = useState<ProductoResponse|null|'new'|'none'>('none')
  const [deleteId,   setDeleteId]   = useState<number|null>(null)
  const [deleteName, setDeleteName] = useState('')

  const catNames = ['Todas', ...Array.from(new Set((productos??[]).filter(p=>p.categoria).map(p=>p.categoria.nombre)))]
  const filtered = useMemo(()=>(productos??[]).filter(p=>
    (catFilt==='Todas'||p.categoria?.nombre===catFilt) &&
    p.nombre.toLowerCase().includes(search.toLowerCase())
  ), [productos,search,catFilt])

  // Chart: products per category + avg price
  const catStats = useMemo(()=>{
    const m: Record<string,{total:number;count:number;stock:number}> = {}
    ;(productos??[]).forEach(p=>{
      const c = p.categoria?.nombre ?? 'Sin categoría'
      if (!m[c]) m[c]={total:0,count:0,stock:0}
      m[c].total += p.precio
      m[c].count++
      m[c].stock += p.stockActual
    })
    return Object.values(Object.fromEntries(
      Object.entries(m).map(([cat,v],i)=>[cat,{
        name:cat, count:v.count,
        avg:Math.round(v.total/v.count*100)/100,
        stock:v.stock,
        color:COLORS[i%COLORS.length]
      }])
    )).sort((a,b)=>b.count-a.count)
  },[productos])

  const precioMedio = useMemo(()=>{
    const all = productos??[]
    return all.length ? all.reduce((s,p)=>s+p.precio,0)/all.length : 0
  },[productos])

  const criticos   = (productos??[]).filter(p=>p.stockActual<=5).length

  const handleSave = async (form: FormProduct) => {
    const data = {
      nombre:form.nombre.trim(), descripcion:form.descripcion||undefined,
      precio:parseFloat(form.precio), stockActual:parseInt(form.stockActual)||0,
      porcentajeIva:parseInt(form.porcentajeIva)||21, idCategoria:parseInt(form.idCategoria),
      imagenUrl:form.imagenUrl||undefined,
    }
    const nuevo = editing===null||editing==='new'
    try {
      if (nuevo) await createProducto(data)
      else if (editing && editing!=='none') await updateProducto((editing as ProductoResponse).idProducto, data)
      refetch(); setEditing('none')
      toast.success(nuevo ? `Producto "${data.nombre}" creado correctamente.` : `Producto "${data.nombre}" actualizado.`)
      return true
    } catch (err) {
      toast.error(errMsg(err, nuevo ? 'No se pudo crear el producto.' : 'No se pudo guardar el producto.'))
      return false
    }
  }

  const handleDelete = async (id:number) => {
    try {
      await deleteProducto(id); refetch()
      toast.success('Producto eliminado.')
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo eliminar el producto. Puede que tenga pedidos asociados.'))
    }
  }

  if (loading) return <Spinner/>
  if (error)   return <ErrorBanner message={error} onRetry={refetch}/>

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Total productos', value:productos?.length??0,         icon:UtensilsCrossed, iconColor:'text-accent'    },
          { label:'Categorías',       value:catStats.length,              icon:Tag,             iconColor:'text-blue-400'  },
          { label:'Precio medio',     value:`€${precioMedio.toFixed(2)}`, icon:TrendingUp,      iconColor:'text-green-400' },
          { label:'Stock crítico',    value:criticos,                     icon:AlertTriangle,   iconColor:'text-red-400'   },
        ].map((c,i)=>(
          <motion.div key={c.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06,duration:.25,ease:[.22,1,.36,1]}}
            className="card p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <c.icon size={12} className={c.iconColor}/>
              <p className="text-[11px] font-semibold text-faint uppercase tracking-wider">{c.label}</p>
            </div>
            <p className="text-[22px] font-bold text-ink tabular-nums leading-none">{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex items-center flex-1 min-w-48">
          <Search size={14} className="absolute left-3 text-faint"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="input input-icon w-full h-9 text-sm" placeholder="Buscar"/>
        </div>
        <select value={catFilt} onChange={e=>setCatFilt(e.target.value)} className="input h-9 text-sm pr-8">
          {catNames.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted">{filtered.length} productos</span>
        <button onClick={()=>setEditing(null)} className="btn-primary ml-auto"><Plus size={15}/> Añadir</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p,i)=>{
          const isCrit = p.stockActual<=5
          const isLow  = p.stockActual>5&&p.stockActual<=20
          return (
            <motion.div key={p.idProducto} initial={{opacity:0,y:16,scale:.97}} animate={{opacity:1,y:0,scale:1}}
              transition={{delay:.15+i*.03,duration:.4,ease:[.22,1,.36,1]}}
              className="card-hover p-5">
              {/* Product image */}
              {p.imagenUrl
                ? <img src={`${p.imagenUrl}?v=${imgV}`} alt={p.nombre}
                    className="w-full h-28 object-contain rounded-lg mb-3 border border-rim bg-surface2"
                    onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
                : <div className="w-full h-20 rounded-lg bg-surface2 border border-rim flex items-center justify-center mb-3">
                    <UtensilsCrossed size={20} className="text-faint"/>
                  </div>
              }
              <div className="flex items-start justify-between mb-1.5">
                <span className="badge bg-surface2 text-faint border border-rim text-[10px]">
                  {p.categoria?.nombre ?? '—'}
                </span>
                <div className="flex gap-1">
                  <button onClick={()=>setEditing(p)} className="w-6 h-6 rounded flex items-center justify-center text-faint hover:text-accent transition-colors">
                    <Edit2 size={11}/></button>
                  <button onClick={()=>{setDeleteId(p.idProducto);setDeleteName(p.nombre)}} className="w-6 h-6 rounded flex items-center justify-center text-faint hover:text-red-400 transition-colors">
                    <Trash2 size={11}/></button>
                </div>
              </div>
              <p className="font-semibold text-ink leading-tight mb-0.5">{p.nombre}</p>
              {p.descripcion && <p className="text-xs text-faint mb-2 line-clamp-2">{p.descripcion}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-accent">€{p.precio.toFixed(2)}</p>
                <span className={`badge border ${isCrit?'bg-red-500/15 text-red-400 border-red-500/20':isLow?'bg-amber-500/15 text-amber-400 border-amber-500/20':'bg-green-500/15 text-green-400 border-green-500/20'}`}>
                  {p.stockActual} ud
                </span>
              </div>
              <p className="text-[10px] text-faint mt-1">IVA {p.porcentajeIva}%</p>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {editing !== 'none' && (
          <ProductModal
            product={editing===null||editing==='new' ? null : editing as ProductoResponse}
            categorias={categorias??[]}
            onClose={()=>setEditing('none')}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar producto"
        message={`¿Seguro que quieres eliminar "${deleteName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={async () => { if (deleteId) await handleDelete(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
