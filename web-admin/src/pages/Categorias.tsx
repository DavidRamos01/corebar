import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { getCategorias, createCategoria, updateCategoria, deleteCategoria, getCategoriasSync } from '../api'
import { Spinner, InlineSpinner } from '../components/Spinner'
import { ErrorBanner } from '../components/ErrorBanner'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { CategoriaResponse } from '../api/types'
import { useToast, errMsg } from '../context/ToastContext'


export default function Categorias() {
  const { data, loading, error, refetch } = useAsync(getCategorias, [], getCategoriasSync)

  const [nueva,    setNueva]    = useState('')
  const [creating, setCreating] = useState(false)
  const [editId,   setEditId]   = useState<number | null>(null)
  const [editVal,  setEditVal]  = useState('')
  const [saving,   setSaving]   = useState(false)
  const [delCat,   setDelCat]   = useState<CategoriaResponse | null>(null)
  const [createErr, setCreateErr] = useState('')
  const [editErr,   setEditErr]   = useState('')
  const toast = useToast()

  const categorias = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [data]
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombre = nueva.trim()
    if (!nombre) { setCreateErr('Escribe el nombre de la categoría.'); return }
    if (categorias.some(c => c.nombre.toLowerCase() === nombre.toLowerCase())) { setCreateErr('Ya existe una categoría con ese nombre.'); return }
    setCreating(true); setCreateErr('')
    try { await createCategoria(nombre); setNueva(''); refetch(); toast.success(`Categoría "${nombre}" creada.`) }
    catch (err) { toast.error(errMsg(err, 'No se pudo crear la categoría.')) }
    finally { setCreating(false) }
  }

  const startEdit = (c: CategoriaResponse) => { setEditId(c.idCategoria); setEditVal(c.nombre); setEditErr('') }

  const saveEdit = async () => {
    const nombre = editVal.trim()
    if (editId === null) return
    if (!nombre) { setEditErr('El nombre no puede estar vacío.'); return }
    if (categorias.some(c => c.idCategoria !== editId && c.nombre.toLowerCase() === nombre.toLowerCase())) { setEditErr('Ya existe una categoría con ese nombre.'); return }
    setSaving(true); setEditErr('')
    try { await updateCategoria(editId, nombre); setEditId(null); refetch(); toast.success('Categoría actualizada.') }
    catch (err) { toast.error(errMsg(err, 'No se pudo guardar el cambio.')) }
    finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!delCat) return
    const nombre = delCat.nombre
    try { await deleteCategoria(delCat.idCategoria); setDelCat(null); refetch(); toast.success(`Categoría "${nombre}" eliminada.`) }
    catch (err) {
      setDelCat(null)
      toast.error(errMsg(err, 'No se pudo eliminar. Puede que tenga productos asignados: cámbialos de categoría primero.'))
    }
  }

  if (loading) return <Spinner />
  if (error)   return <ErrorBanner message={error} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-ink">Categorías de productos</h2>
        <p className="text-sm text-muted">Gestiona las categorías del menú</p>
      </div>

      {/* Nueva categoría */}
      <motion.form onSubmit={handleCreate} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .25, ease: [.22, 1, .36, 1] }} className="card p-4 flex items-center gap-3">
        <div className="flex-1">
          <input value={nueva} onChange={e => { setNueva(e.target.value); if (createErr) setCreateErr('') }} maxLength={60}
            className={'input w-full h-10 text-sm' + (createErr ? ' input-error' : '')} placeholder="Nueva categoría..." aria-invalid={!!createErr} />
          {createErr && <p className="field-error" role="alert">{createErr}</p>}
        </div>
        <button type="submit" disabled={creating} className="btn-primary h-10 disabled:opacity-50 self-start">
          {creating ? <InlineSpinner /> : <Plus size={15} />} Crear
        </button>
      </motion.form>

      {/* Lista */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .08, duration: .35, ease: [.22, 1, .36, 1] }} className="card overflow-hidden">
        {categorias.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">Todavía no hay categorías. Crea la primera arriba.</p>
        )}
        <AnimatePresence initial={false}>
          {categorias.map(c => (
            <motion.div key={c.idCategoria} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-rim last:border-b-0 hover:bg-surface2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Tag size={14} className="text-accent" />
              </div>

              {editId === c.idCategoria ? (
                <>
                  <div className="flex-1">
                    <input value={editVal} onChange={e => { setEditVal(e.target.value); if (editErr) setEditErr('') }} autoFocus maxLength={60}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null) }}
                      className={'input w-full h-9 text-sm' + (editErr ? ' input-error' : '')} aria-invalid={!!editErr} />
                    {editErr && <p className="field-error" role="alert">{editErr}</p>}
                  </div>
                  <button onClick={saveEdit} disabled={saving} title="Guardar"
                    className="w-8 h-8 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-500 flex items-center justify-center disabled:opacity-50">
                    {saving ? <InlineSpinner /> : <Check size={15} />}
                  </button>
                  <button onClick={() => setEditId(null)} title="Cancelar"
                    className="w-8 h-8 rounded-lg bg-surface2 hover:bg-rim text-muted flex items-center justify-center">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-ink">{c.nombre}</span>
                  <button onClick={() => startEdit(c)} title="Renombrar"
                    className="w-8 h-8 rounded-lg text-faint hover:text-accent hover:bg-accent/10 flex items-center justify-center transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDelCat(c)} title="Eliminar"
                    className="w-8 h-8 rounded-lg text-faint hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <ConfirmDialog open={!!delCat} title="Eliminar categoría"
        message={`¿Eliminar "${delCat?.nombre ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete} onCancel={() => setDelCat(null)} />
    </div>
  )
}
