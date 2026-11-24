import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Edit2, Trash2, UserCheck, UserX, Search } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAsync } from '../hooks/useAsync'
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getUsuariosSync } from '../api'
import { Spinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { UsuarioResponse } from '../api/types'
import { Portal } from '../components/Portal'
import { useToast, errMsg } from '../context/ToastContext'

const TT = {
  contentStyle: { background: '#0f1349', border: '1px solid #242b7a', borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: '#9faac2' },
  itemStyle:    { color: '#ffffff' },
}

const ROL_STYLE: Record<string,string> = {
  ADMIN:     'bg-accent/15 text-accent border-accent/20',
  CAMARERO:  'bg-green-500/15 text-green-400 border-green-500/20',
  COCINERO:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
}
const ROL_COLORS: Record<string,string> = { ADMIN:'#F59E0B', CAMARERO:'#22C55E', COCINERO:'#60A5FA' }

const ROLES = ['ADMIN','CAMARERO','COCINERO']

type FormUser = { nombre:string; username:string; password:string; rol:string; activo:boolean }
const emptyForm: FormUser = { nombre:'', username:'', password:'', rol:'CAMARERO', activo:true }

function UserModal({
  user, onClose, onSave,
}: { user:UsuarioResponse|null; onClose:()=>void; onSave:(data:FormUser)=>Promise<boolean> }) {
  const [form, setForm] = useState<FormUser>(user ? { ...user, password:'' } : emptyForm)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [saving, setSaving] = useState(false)

  const setField = (k: keyof FormUser, v: string|boolean) => {
    setForm(f=>({...f,[k]:v}))
    if (errors[k]) setErrors(e=>{ const n={...e}; delete n[k]; return n })
  }
  const cls = (k: string) => 'input w-full' + (errors[k] ? ' input-error' : '')
  const fieldErr = (k: string) => errors[k] ? <p className="field-error" role="alert">{errors[k]}</p> : null

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.nombre.trim()) e.nombre = 'Escribe el nombre.'
    if (!form.username.trim()) e.username = 'Escribe el nombre de usuario.'
    else if (/\s/.test(form.username.trim())) e.username = 'El usuario no puede llevar espacios.'
    if (!user && !form.password) e.password = 'Escribe una contraseña.'
    else if (form.password && form.password.length < 4) e.password = 'Debe tener al menos 4 caracteres.'
    return e
  }

  const submit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSaving(true)
    const ok = await onSave({ ...form, nombre:form.nombre.trim(), username:form.username.trim() })
    if (!ok) setSaving(false)
  }
  return (
    <Portal><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{opacity:0,scale:.93}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.93}}
        onClick={e=>e.stopPropagation()}
        className="bg-surface border border-rim rounded-xl p-6 w-full max-w-md shadow-2xl">
        <p className="font-bold text-lg text-ink mb-5">{user ? 'Editar usuario' : 'Nuevo usuario'}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-xs text-muted block mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e=>setField('nombre',e.target.value)} className={cls('nombre')}/>{fieldErr('nombre')}</div>
          <div><label className="text-xs text-muted block mb-1">Usuario *</label>
            <input value={form.username} onChange={e=>setField('username',e.target.value)} className={cls('username')}/>{fieldErr('username')}</div>
          <div><label className="text-xs text-muted block mb-1">{user?'Nueva contraseña':'Contraseña *'}</label>
            <input type="password" value={form.password} onChange={e=>setField('password',e.target.value)} className={cls('password')} placeholder={user?'Dejar vacío para no cambiar':''}/>{fieldErr('password')}</div>
          <div><label className="text-xs text-muted block mb-1">Rol</label>
            <select value={form.rol} onChange={e=>setForm(f=>({...f,rol:e.target.value}))} className="input w-full pr-8">
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select></div>
          <div className="flex items-center gap-3 pt-5">
            <input type="checkbox" checked={form.activo} onChange={e=>setForm(f=>({...f,activo:e.target.checked}))} id="activo" className="w-4 h-4 accent-accent"/>
            <label htmlFor="activo" className="text-sm text-ink">Activo</label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-ghost flex-1" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn-primary flex-1 justify-center disabled:opacity-60" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </motion.div>
    </div></Portal>
  )
}

export default function Usuarios() {
  const { data:usuarios, loading, error, refetch } = useAsync(getUsuarios, [], getUsuariosSync)
  const [search,     setSearch]     = useState('')
  const [editing,    setEditing]    = useState<UsuarioResponse|null|'new'>('none' as any)
  const [deleteId,   setDeleteId]   = useState<number|null>(null)
  const [deleteName, setDeleteName] = useState('')
  const toast = useToast()
  const showModal = editing !== ('none' as any)

  const filtered = (usuarios??[]).filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  const byRol = ROLES.map(r=>({
    name:r, value:(usuarios??[]).filter(u=>u.rol===r).length, color:ROL_COLORS[r]
  })).filter(r=>r.value>0)

  const activos   = (usuarios??[]).filter(u=>u.activo).length
  const inactivos = (usuarios??[]).filter(u=>!u.activo).length

  const handleSave = async (form: FormUser) => {
    const nuevo = editing === null
    try {
      if (editing === null) {
        await createUsuario({ ...form })
      } else if (editing && editing !== 'new') {
        const payload: any = { nombre:form.nombre, username:form.username, rol:form.rol, activo:form.activo }
        if (form.password) payload.password = form.password
        await updateUsuario((editing as UsuarioResponse).idUsuario, payload)
      }
      refetch(); setEditing('none' as any)
      toast.success(nuevo ? `Usuario "${form.nombre}" creado correctamente.` : `Usuario "${form.nombre}" actualizado.`)
      return true
    } catch (err) {
      toast.error(errMsg(err, nuevo ? 'No se pudo crear el usuario.' : 'No se pudo guardar el usuario.'))
      return false
    }
  }

  const handleDelete = async (id:number) => {
    try {
      await deleteUsuario(id); refetch()
      toast.success('Usuario eliminado.')
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo eliminar el usuario.'))
    }
  }

  const handleToggleActivo = async (u: UsuarioResponse) => {
    try {
      await updateUsuario(u.idUsuario, { activo: !u.activo }); refetch()
      toast.success(u.activo ? `"${u.nombre}" desactivado.` : `"${u.nombre}" activado.`)
    } catch (err) {
      toast.error(errMsg(err, 'No se pudo cambiar el estado del usuario.'))
    }
  }

  if (loading) return <Spinner/>
  if (error)   return <ErrorBanner message={error} onRetry={refetch}/>

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.1,duration:.4,ease:[.22,1,.36,1]}}
          className="card p-5 flex items-center gap-4">
          <ResponsiveContainer width={80} height={80}>
            <PieChart>
              <Pie data={byRol} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={36} paddingAngle={3}>
                {byRol.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}
              </Pie>
              <Tooltip {...TT} formatter={(v:any,_:string,p:any)=>[v,p.payload.name]}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 text-xs">
            {byRol.map(r=>(
              <div key={r.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{background:r.color}}/>
                <span className="text-muted capitalize">{r.name.toLowerCase()}</span>
                <span className="font-bold text-ink ml-auto">{r.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {[
          {label:'Total usuarios', value:usuarios?.length??0, color:'text-ink'},
          {label:'Activos',         value:activos,              color:'text-green-400'},
          {label:'Inactivos',       value:inactivos,            color:'text-red-400'},
        ].map((c,i)=>(
          <motion.div key={c.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.12+i*.07,duration:.25,ease:[.22,1,.36,1]}}
            className="card p-4">
            <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-[26px] font-bold tabular-nums leading-none ${c.color}`}>{c.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 text-faint"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="input input-icon w-full h-9 text-sm" placeholder="Buscar usuario"/>
        </div>
        <button onClick={()=>setEditing(null)} className="btn-primary ml-auto"><Plus size={15}/> Nuevo usuario</button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((u,i)=>(
          <motion.div key={u.idUsuario} initial={{opacity:0,y:16,scale:.97}} animate={{opacity:1,y:0,scale:1}}
            transition={{delay:.15+i*.04,duration:.4,ease:[.22,1,.36,1]}}
            className={`card-hover p-5 ${!u.activo ? 'opacity-60':''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={()=>handleToggleActivo(u)} title={u.activo?'Desactivar':'Activar'}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${u.activo?'bg-green-500/10 text-green-400 hover:bg-green-500/20':'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                  {u.activo ? <UserCheck size={13}/> : <UserX size={13}/>}
                </button>
                <button onClick={()=>setEditing(u)} className="w-7 h-7 rounded-lg bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors">
                  <Edit2 size={12}/>
                </button>
                <button onClick={()=>{setDeleteId(u.idUsuario);setDeleteName(u.nombre)}} className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors">
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
            <p className="font-bold text-ink">{u.nombre}</p>
            <p className="text-xs text-muted mb-3">@{u.username}</p>
            <div className="flex items-center justify-between">
              <span className={`badge border text-[10px] capitalize ${ROL_STYLE[u.rol]??'bg-surface2 text-muted border-rim'}`}>
                {u.rol.toLowerCase()}
              </span>
              <span className={`text-xs font-medium ${u.activo?'text-green-400':'text-red-400'}`}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <UserModal
            user={editing === null || editing === 'new' ? null : editing as UsuarioResponse}
            onClose={()=>setEditing('none' as any)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar usuario"
        message={`¿Seguro que quieres eliminar a "${deleteName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={async () => { if (deleteId) await handleDelete(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
