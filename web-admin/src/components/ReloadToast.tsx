import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

export function ReloadToast() {
  return (
    <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="card px-7 py-6 flex flex-col items-center gap-4 w-64 shadow-card-md"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={18} className="text-accent" />
        </motion.div>

        <div className="text-center">
          <p className="font-semibold text-sm text-ink">Actualizando datos</p>
          <p className="text-xs text-muted mt-0.5">Un momento…</p>
        </div>

        <div className="w-full h-1 rounded-full bg-surface2 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 8, ease: 'easeInOut' }}
            className="h-full rounded-full bg-accent/50"
          />
        </div>
      </motion.div>
    </div>
  )
}
