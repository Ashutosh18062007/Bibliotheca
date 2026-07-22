import { type LucideIcon } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon size={28} className="text-gray-400" />
      </div>
      <p className="mt-4 font-semibold text-gray-700 dark:text-slate-300">{title}</p>
      {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>}
    </div>
  )
}
