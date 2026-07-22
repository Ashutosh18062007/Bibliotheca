import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, BookOpen, IndianRupee, Download, Calendar, FileText, PieChart, Activity } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useBooks, useMembers, useCirculation, useFines, useVisitors, useAttendance } from '@/lib/queries'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { formatCurrency } from '@/lib/format'

type Range = 'week' | 'month' | 'quarter' | 'year'

export default function Reports() {
  const { data: books } = useBooks()
  const { data: members } = useMembers()
  const { data: circulation } = useCirculation()
  const { data: fines } = useFines()
  const { data: visitors } = useVisitors()
  const { data: attendance } = useAttendance()
  const [range, setRange] = useState<Range>('month')

  const days = range === 'week' ? 7 : range === 'month' ? 30 : range === 'quarter' ? 90 : 365

  const circTrend = useMemo(() => {
    const labels: string[] = []
    const issueData: number[] = []
    const returnData: number[] = []
    for (let i = days - 1; i >= 0; i -= Math.max(1, Math.floor(days / 12))) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toDateString()
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      issueData.push(circulation?.filter((c) => new Date(c.issue_date).toDateString() === key).length || 0)
      returnData.push(circulation?.filter((c) => c.return_date && new Date(c.return_date).toDateString() === key).length || 0)
    }
    return { labels, issueData, returnData }
  }, [circulation, days])

  const categoryDist = useMemo(() => {
    const map = new Map<string, number>()
    books?.forEach((b) => { if (b.category) map.set(b.category, (map.get(b.category) || 0) + 1) })
    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
    return { labels: sorted.map((e) => e[0]), data: sorted.map((e) => e[1]) }
  }, [books])

  const memberRoles = useMemo(() => {
    const map = new Map<string, number>()
    members?.forEach((m) => { if (m.role) map.set(m.role, (map.get(m.role) || 0) + 1) })
    return { labels: Array.from(map.keys()), data: Array.from(map.values()) }
  }, [members])

  const visitorTrend = useMemo(() => {
    const labels: string[] = []
    const data: number[] = []
    for (let i = days - 1; i >= 0; i -= Math.max(1, Math.floor(days / 12))) {
      const d = new Date(); d.setDate(d.getDate() - i)
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      data.push(visitors?.filter((v) => new Date(v.entry_time).toDateString() === d.toDateString()).length || 0)
    }
    return { labels, data }
  }, [visitors, days])

  const fineStats = useMemo(() => {
    const collected = fines?.filter((f) => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0) || 0
    const pending = fines?.filter((f) => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0) || 0
    return { collected, pending }
  }, [fines])

  const kpis = [
    { label: 'Total Books', value: books?.length || 0, icon: BookOpen, color: 'primary' },
    { label: 'Total Members', value: members?.length || 0, icon: Users, color: 'accent' },
    { label: 'Active Loans', value: circulation?.filter((c) => !c.return_date).length || 0, icon: Activity, color: 'warning' },
    { label: 'Fines Collected', value: formatCurrency(fineStats.collected), icon: IndianRupee, color: 'success' },
  ]

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } } }
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } } }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Reports & Analytics" description="Comprehensive insights and performance metrics"
        actions={<>
          <select className="input w-auto" value={range} onChange={(e) => setRange(e.target.value as Range)}>
            <option value="week">Last 7 Days</option><option value="month">Last 30 Days</option><option value="quarter">Last Quarter</option><option value="year">Last Year</option>
          </select>
          <button className="btn-secondary"><Download size={16} /> Export PDF</button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => {
          const colors: Record<string, string> = { primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600', accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600', warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600', success: 'bg-success-100 dark:bg-success-900/30 text-success-600' }
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[kpi.color]}`}><kpi.icon size={18} /></div>
              <div><p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p><p className="text-xs text-gray-500">{kpi.label}</p></div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><TrendingUp size={16} className="text-primary-500" /> Circulation Trends</h3></div>
          <div style={{ height: 240 }}><Line data={{ labels: circTrend.labels, datasets: [{ label: 'Issued', data: circTrend.issueData, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4, fill: true }, { label: 'Returned', data: circTrend.returnData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4, fill: true }] }} options={chartOpts} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><PieChart size={16} className="text-accent-500" /> Book Categories</h3></div>
          <div style={{ height: 240 }}><Doughnut data={{ labels: categoryDist.labels, datasets: [{ data: categoryDist.data, backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'] }] }} options={doughnutOpts} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 size={16} className="text-warning-500" /> Visitor Footfall</h3></div>
          <div style={{ height: 240 }}><Bar data={{ labels: visitorTrend.labels, datasets: [{ label: 'Visitors', data: visitorTrend.data, backgroundColor: '#f59e0b', borderRadius: 6 }] }} options={chartOpts} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Users size={16} className="text-success-500" /> Member Roles</h3></div>
          <div style={{ height: 240 }}><Doughnut data={{ labels: memberRoles.labels, datasets: [{ data: memberRoles.data, backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'] }] }} options={doughnutOpts} /></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FileText size={16} className="text-primary-500" /> Generate Report</h3>
          <div className="space-y-2">
            {['Book Inventory Report', 'Member Directory', 'Circulation Summary', 'Fine Collection Report', 'Visitor Log Report', 'Attendance Report'].map((r) => (
              <button key={r} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 text-left group">
                <span className="text-sm text-gray-700 dark:text-slate-300">{r}</span>
                <Download size={14} className="text-gray-400 group-hover:text-primary-500" />
              </button>
            ))}
          </div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Calendar size={16} className="text-accent-500" /> Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-xs text-gray-500">Total Issues</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{circulation?.length || 0}</p></div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-xs text-gray-500">Total Returns</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{circulation?.filter((c) => c.return_date).length || 0}</p></div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-xs text-gray-500">Overdue Books</p><p className="text-xl font-bold text-error-600 mt-1">{circulation?.filter((c) => !c.return_date && c.due_date && new Date(c.due_date) < new Date()).length || 0}</p></div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-xs text-gray-500">Pending Fines</p><p className="text-xl font-bold text-warning-600 mt-1">{formatCurrency(fineStats.pending)}</p></div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-xs text-gray-500">Total Visitors</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{visitors?.length || 0}</p></div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-xs text-gray-500">Attendance Sessions</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{attendance?.length || 0}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
