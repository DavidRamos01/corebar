import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { Portal } from '../components/Portal'

type ToastKind = 'success' | 'error'
type ToastItem = { id: number; kind: ToastKind; text: string }

type ToastApi = {
  success: (text: string) => void
  error: (text: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Saca el mensaje que manda el backend ({ error: "..." }) o usa uno por defecto */
export function errMsg(e: any, fallback: string): string {
  const data = e?.response?.data
  if (typeof data === 'string' && data) return data
  return data?.error ?? data?.message ?? (e?.response ? fallback : 'No hay conexión con el servidor. Inténtalo de nuevo.')
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setItems(list => list.filter(t => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = nextId.current++
    setItems(list => [...list.slice(-3), { id, kind, text }])
    window.setTimeout(() => remove(id), kind === 'error' ? 6000 : 3500)
  }, [remove])

  const api = useMemo<ToastApi>(() => ({
    success: (text) => push('success', text),
    error: (text) => push('error', text),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Portal>
        <div className="fixed z-[200] top-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence initial={false}>
            {items.map(t => (
              <motion.div
                key={t.id}
                layout
                role={t.kind === 'error' ? 'alert' : 'status'}
                initial={{ opacity: 0, y: -14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl bg-surface ${
                  t.kind === 'error' ? 'border-red-500/40' : 'border-green-500/40'
                }`}
              >
                {t.kind === 'error'
                  ? <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  : <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />}
                <p className="text-sm text-ink flex-1 leading-snug">{t.text}</p>
                <button type="button" onClick={() => remove(t.id)} aria-label="Cerrar aviso"
                  className="text-faint hover:text-ink transition-colors flex-shrink-0">
                  <X size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Portal>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
