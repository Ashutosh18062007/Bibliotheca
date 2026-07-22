import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, Calendar, Download, Flame, Plus, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useAttendance, useMembers, useSaveAttendance, useDeleteAttendance } from '@/lib/queries'
import { formatDateTime, initials, avatarColor } from '@/lib/format'

export default function Attendance() {
  const { data: attendance, isLoading } = useAttendance()
  const { data: members } = useMembers()
  const saveAtt = useSaveAttendance()
  const deleteAtt = useDeleteAttendance()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selMember, setSelMember] = useState('')
  const [purpose, setPurpose] = useState('Study')

  const stats = useMemo(() => {
    const total = attendance?.length || 0
    const totalMinutes = attendance?.reduce((s, a) => s + (a.duration_minutes || 0), 0) || 0
    const avg = total > 0 ? Math.round(totalMinutes / total) : 0
    const today = attendance?.filter((a) => new Date(a.entry_time).toDateString() === new Date().toDateString()).length || 0
    return { total, avg, today, totalMinutes }
  }, [attendance])

  const topMembers = useMemo(() => {
    const map = new Map<string, number>()
    attendance?.forEach((a) => { if (a.member_id) map.set(a.member_id, (map.get(a.member_id) || 0) + (a.duration_minutes || 0)) })
    return Array.from(map.entries()).map(([id, mins]) => ({ member: members?.find((m) => m.id === id), mins })).filter((x) => x.member).sort((a, b) => b.mins - a.mins).slice(0, 5)
  }, [attendance, members])

  const heatmap = useMemo(() => {
    const grid: { date: Date; count: number }[] = []
    const today = new Date()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const count = attendance?.filter((a) => new Date(a.entry_time).toDateString() === d.toDateString()).length || 0
      grid.push({ date: d, count })
    }
    return grid
  }, [attendance])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selMember) return
    const member = members?.find((m) => m.id === selMember)
    await saveAtt.mutateAsync({ member_id: selMember, card_number: member?.card_number, entry_time: new Date().toISOString(), purpose } as any)
    setModalOpen(false); setSelMember(''); setPurpose('Study')
  }

  if (isLoading) return <LoadingSpinner label="Loading attendance..." />

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Library Attendance" description="Track entry/exit times and study patterns"
        actions={<><button className="btn-secondary"><Download size={16} /> Export CSV</button><button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Log Entry</button></>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><Clock size={18} className="text-primary-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.today}</p><p className="text-xs text-gray-500">Today's Visits</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center"><Calendar size={18} className="text-accent-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p><p className="text-xs text-gray-500">Total Sessions</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center"><TrendingUp size={18} className="text-success-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avg}m</p><p className="text-xs text-gray-500">Avg Duration</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center"><Flame size={18} className="text-warning-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.totalMinutes / 60)}h</p><p className="text-xs text-gray-500">Total Hours</p></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance Heatmap (4 weeks)</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-center text-[10px] text-gray-400 mb-1">{d}</div>)}
            {heatmap.map((cell, i) => {
              const intensity = Math.min(cell.count / 5, 1)
              const bg = cell.count === 0 ? 'bg-gray-100 dark:bg-slate-800' : intensity < 0.3 ? 'bg-primary-200 dark:bg-primary-800' : intensity < 0.6 ? 'bg-primary-400 dark:bg-primary-600' : 'bg-primary-600 dark:bg-primary-400'
              return <div key={i} className={`aspect-square rounded ${bg} flex items-center justify-center text-[9px] text-white/0 hover:text-white/80 transition-colors cursor-pointer`} title={`${cell.date.toLocaleDateString()} — ${cell.count} visits`}>{cell.count > 0 ? cell.count : ''}</div>
            })}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Most Active Members</h3>
          <div className="space-y-3">
            {topMembers.map((t, i) => (
              <div key={t.member!.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                <div className={`w-8 h-8 rounded-full ${avatarColor(t.member!.full_name)} flex items-center justify-center text-white text-xs font-semibold`}>{initials(t.member!.full_name)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.member!.full_name}</p><div className="flex items-center gap-1 mt-0.5"><div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{ width: `${(t.mins / (topMembers[0]?.mins || 1)) * 100}%` }} /></div><span className="text-[10px] text-gray-400 ml-1.5">{Math.round(t.mins / 60)}h</span></div></div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800"><h3 className="font-semibold text-gray-900 dark:text-white">Recent Sessions</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr><th className="p-3 font-medium">Member</th><th className="p-3 font-medium">Entry</th><th className="p-3 font-medium">Exit</th><th className="p-3 font-medium">Duration</th><th className="p-3 font-medium">Purpose</th><th className="p-3 font-medium">Actions</th></tr>
            </thead>
            <tbody>
              {(attendance || []).slice(0, 15).map((a) => (
                <tr key={a.id} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{a.member?.full_name || a.card_number || '—'}</td>
                  <td className="p-3 text-gray-500">{formatDateTime(a.entry_time)}</td>
                  <td className="p-3 text-gray-500">{a.exit_time ? formatDateTime(a.exit_time) : '—'}</td>
                  <td className="p-3"><span className="badge-info">{a.duration_minutes ? `${a.duration_minutes}m` : 'Active'}</span></td>
                  <td className="p-3 text-gray-500">{a.purpose || '—'}</td>
                  <td className="p-3"><button onClick={() => setDeleteId(a.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Attendance Entry" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div><label className="label">Member *</label><select className="input" value={selMember} onChange={(e) => setSelMember(e.target.value)} required><option value="">Choose a member...</option>{(members || []).map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.card_number}) — {m.role}</option>)}</select></div>
          <div><label className="label">Purpose</label><select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}><option>Study</option><option>Reading</option><option>Research</option><option>Issue/Return</option><option>Meeting</option></select></div>
          {saveAtt.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(saveAtt.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saveAtt.isPending} className="btn-primary">{saveAtt.isPending ? 'Saving...' : 'Log Entry'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteAtt.mutateAsync(deleteId) }} title="Delete Attendance" message="Delete this attendance record? This cannot be undone." />
    </div>
  )
}
