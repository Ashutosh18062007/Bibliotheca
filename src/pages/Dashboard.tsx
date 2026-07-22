import { motion } from 'framer-motion'
import {
  BookOpen, Users, ArrowLeftRight, UserCheck, AlertTriangle, IndianRupee,
  Clock, Activity, Bell, Calendar, Zap, TrendingUp,
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useBooks, useMembers, useCirculation, useAnalytics, useActivityLog, useAnnouncements, useVisitors } from '@/lib/queries'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format'
import { useAppSelector } from '@/store/hooks'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function Dashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const { data: books, isLoading } = useBooks()
  const { data: members } = useMembers()
  const { data: circulation } = useCirculation()
  const { data: analytics } = useAnalytics()
  const { data: activity } = useActivityLog()
  const { data: announcements } = useAnnouncements()
  const { data: visitors } = useVisitors()

  if (isLoading) return <LoadingSpinner label="Loading dashboard..." />

  const totalCopies = books?.reduce((s, b) => s + b.total_copies, 0) || 0
  const availableCopies = books?.reduce((s, b) => s + b.available_copies, 0) || 0
  const issuedCount = circulation?.filter((c) => c.status === 'issued' || c.status === 'overdue').length || 0
  const overdueCount = circulation?.filter((c) => c.status === 'overdue').length || 0
  const totalMembers = members?.length || 0
  const students = members?.filter((m) => m.role === 'Student').length || 0
  const teachers = members?.filter((m) => m.role === 'Teacher').length || 0
  const todayVisitors = visitors?.filter((v) => new Date(v.entry_time).toDateString() === new Date().toDateString()).length || 0
  const lastSnapshot = analytics?.[analytics.length - 1]
  const revenue = analytics?.reduce((s, a) => s + Number(a.revenue), 0) || 0
  const pendingPayments = analytics?.reduce((s, a) => s + Number(a.pending_payments), 0) || 0

  const chartData = analytics || []
  const lineData = {
    labels: chartData.map((a) => new Date(a.snapshot_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
    datasets: [
      { label: 'Books Issued', data: chartData.map((a) => a.books_issued), borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.4 },
      { label: 'Books Returned', data: chartData.map((a) => a.books_returned), borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, tension: 0.4 },
    ],
  }
  const barData = {
    labels: chartData.slice(-7).map((a) => new Date(a.snapshot_date).toLocaleDateString('en-IN', { weekday: 'short' })),
    datasets: [{ label: 'Visitors', data: chartData.slice(-7).map((a) => a.visitors), backgroundColor: '#06b6d4', borderRadius: 6 }],
  }
  const doughnutData = {
    labels: ['Available', 'Issued', 'Lost', 'Damaged'],
    datasets: [{
      data: [availableCopies, issuedCount, books?.reduce((s, b) => s + b.lost_copies, 0) || 0, books?.reduce((s, b) => s + b.damaged_copies, 0) || 0],
      backgroundColor: ['#2563eb', '#f59e0b', '#dc2626', '#9ca3af'], borderWidth: 0,
    }],
  }
  const chartOptions = {
    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    },
  }
  const doughnutOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`} description="Here's what's happening in your library today"
        actions={<><button className="btn-secondary"><Calendar size={16} /> Today</button><button className="btn-primary"><Zap size={16} /> Quick Issue</button></>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Books" value={formatNumber(totalCopies)} icon={BookOpen} trend={12} color="primary" delay={0} />
        <StatCard title="Active Members" value={formatNumber(totalMembers)} icon={Users} trend={8} color="accent" delay={0.05} />
        <StatCard title="Books Issued" value={formatNumber(issuedCount)} icon={ArrowLeftRight} trend={-3} color="warning" delay={0.1} />
        <StatCard title="Today's Visitors" value={formatNumber(todayVisitors || lastSnapshot?.visitors || 0)} icon={UserCheck} trend={15} color="success" delay={0.15} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Overdue Books" value={formatNumber(overdueCount)} icon={AlertTriangle} color="error" delay={0.2} />
        <StatCard title="Revenue (14d)" value={formatCurrency(revenue)} icon={IndianRupee} trend={18} color="success" delay={0.25} />
        <StatCard title="Pending Payments" value={formatCurrency(pendingPayments)} icon={Clock} color="warning" delay={0.3} />
        <StatCard title="Students / Teachers" value={`${students} / ${teachers}`} icon={Activity} color="primary" delay={0.35} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-semibold text-gray-900 dark:text-white">Circulation Trends</h3><p className="text-xs text-gray-500">Books issued vs returned (14 days)</p></div><TrendingUp size={20} className="text-primary-500" /></div>
          <div className="h-64"><Line data={lineData} options={chartOptions} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Inventory Status</h3>
          <div className="h-64"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Visitors</h3>
          <div className="h-56"><Bar data={barData} options={chartOptions} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900 dark:text-white">Announcements</h3><Bell size={18} className="text-gray-400" /></div>
          <div className="space-y-3">
            {(announcements || []).slice(0, 3).map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1"><span className={`badge ${a.priority === 'high' ? 'badge-error' : 'badge-info'}`}>{a.priority}</span><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</p></div>
                <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{a.body}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(activity || []).slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0"><Activity size={16} className="text-primary-600" /></div>
                <div className="min-w-0 flex-1"><p className="text-sm text-gray-900 dark:text-white"><span className="font-semibold">{log.actor}</span> {log.action.replace(/_/g, ' ')} <span className="text-gray-500">{log.entity}</span></p><p className="text-xs text-gray-400">{timeAgo(log.created_at)}</p></div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Issue Book', icon: ArrowLeftRight, color: 'bg-primary-500' }, { label: 'Add Member', icon: Users, color: 'bg-accent-500' },
              { label: 'Add Book', icon: BookOpen, color: 'bg-success-500' }, { label: 'Collect Fine', icon: IndianRupee, color: 'bg-warning-500' },
              { label: 'Log Visitor', icon: UserCheck, color: 'bg-primary-700' }, { label: 'View Reports', icon: TrendingUp, color: 'bg-accent-700' },
            ].map((a) => (
              <button key={a.label} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all hover:-translate-y-0.5">
                <div className={`w-10 h-10 rounded-lg ${a.color} flex items-center justify-center`}><a.icon size={18} className="text-white" /></div>
                <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{a.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
