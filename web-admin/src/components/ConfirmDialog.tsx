import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Portal } from './Portal'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onCancel, danger = true }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <Portal><div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: .93, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: .93, y: 8 }}
            transition={{ duration: .18, ease: [.22, 1, .36, 1] }}
            onClick={e => e.stopPropagation()}
            className="bg-surface border border-rim rounded-xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                <AlertTriangle size={18} className={danger ? 'text-red-400' : 'text-amber-400'} />
              </div>
              <div>
                <p className="font-bold text-ink leading-tight">{title}</p>
                <p className="text-sm text-muted mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={onCancel}>Cancelar</button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  danger
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div></Portal>
      )}
    </AnimatePresence>
  )
}
