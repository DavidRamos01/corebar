import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  title: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  icon: LucideIcon
  iconBg: string       // e.g. 'bg-indigo-50'
  iconColor: string    // e.g. 'text-indigo-500'
  change?: number      // % change, signed
  description?: string // e.g. 'vs semana anterior'
  delay?: number
}

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const mv = useMotionValue(0)
  const rounded = useTransform(mv, v =>
    `${prefix}${v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`
  )
  useEffect(() => {
    const ctrl = animate(mv, value, { duration: 1.0, ease: [.22, 1, .36, 1] })
    return () => ctrl.stop()
  }, [value])
  return <motion.span>{rounded}</motion.span>
}

export default function StatCard({
  title, value, prefix = '', suffix = '', decimals = 0,
  icon: Icon, iconBg, iconColor, change, description, delay = 0,
}: Props) {
  const isUp = (change ?? 0) >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: .3, ease: [.22, 1, .36, 1] }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted">{title}</p>
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={17} className={iconColor} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-2 gap-y-1 mb-1">
        <p className="kpi-value">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 mb-0.5 text-xs font-semibold ${isUp ? 'text-success' : 'text-danger'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}{change.toFixed(1)}%
          </div>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-faint">{description}</p>
      )}
    </motion.div>
  )
}
