import { motion } from 'framer-motion'

const LOGO = '/logo.png'
const STEPS = ['Cargando categorías…', 'Cargando productos…', 'Cargando usuarios…', 'Cargando mesas…', 'Cargando pedidos…', 'Cargando facturas…']

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        transition={{ duration: .6, ease: [.22, 1, .36, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <img
          src={LOGO}
          alt="CoreBar"
          className="w-32 h-32 object-contain select-none drop-shadow-2xl"
          draggable={false}
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const fallback = target.nextElementSibling as HTMLElement | null
            if (fallback) fallback.style.display = 'flex'
          }}
        />
        <div style={{display:'none'}} className="w-32 h-32 rounded-3xl bg-accent/20 border border-accent/30 flex items-center justify-center">
          <span className="text-5xl font-black text-accent select-none">C</span>
        </div>

        <div className="text-center">
          <p className="font-bold text-2xl text-ink tracking-tight">CoreBar Admin</p>
          <p className="text-sm text-muted mt-1">Preparando el panel de control…</p>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .3, duration: .4 }}
        className="mt-10 w-56"
      >
        <div className="h-1 rounded-full bg-surface2 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: .4, duration: 1.8, ease: 'easeInOut' }}
            className="h-full rounded-full bg-accent"
          />
        </div>
      </motion.div>

      {/* Steps ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: .5 }}
        className="mt-4 h-5 overflow-hidden"
      >
        {STEPS.map((s, i) => (
          <motion.p
            key={s}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -6] }}
            transition={{ delay: .4 + i * .28, duration: .28 * 2, times: [0, .15, .85, 1] }}
            className="text-xs text-faint text-center"
          >
            {s}
          </motion.p>
        ))}
      </motion.div>
    </div>
  )
}
