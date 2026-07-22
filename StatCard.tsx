import { motion } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error'
  delay?: number
}

const COLORS = {
  primary: { bg: 'bg-primary-50 dark:bg-primary-900/20', text: 'text-primary-600 dark:text-primary-400' },
  accent: { bg: 'bg-accent-50 dark:bg-accent-900/20', text: 'text-accent-600 dark:text-accent-400' },
  success: { bg: 'bg-success-50 dark:bg-success-900/20', text: 'text-success-600 dark:text-success-400' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-900/20', text: 'text-warning-600 dark:text-warning-400' },
  error: { bg: 'bg-error-50 dark:bg-error-900/20', text: 'text-error-600 dark:text-error-400' },
}

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'primary', delay = 0 }: StatCardProps) {
  const c = COLORS[color]
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold font-display text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <Icon size={22} className={c.text} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? 'text-success-600' : 'text-error-600'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400">{trendLabel || 'vs last week'}</span>
        </div>
      )}
    </motion.div>
  )
}
