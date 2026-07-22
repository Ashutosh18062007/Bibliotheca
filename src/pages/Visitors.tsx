import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Plus, Download, Clock, LogIn, Trash2, Pencil } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useVisitors, useSaveVisitor, useDeleteVisitor } from '@/lib/queries'
import { formatDateTime, initials, avatarColor } from '@/lib/format'
import type { Visitor } from '@/types'

const EMPTY: Partial<Visitor> = { visitor_type: 'Guest', name: '', mobile: '', email: '', purpose: '', host_name: '', pass_number: '' }

export default function Visitors() {
  const { data: visitors, isLoading } = useVisitors()
  const saveV = useSaveVisitor()
  const deleteV = useDeleteVisitor()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Visitor> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Visitor>>(EMPTY)

  const stats = useMemo(() => {
    const today = visitors?.filter((v) => new Date(v.entry_time).toDateString() === new Date().toDateString()).length || 0
    const inside = visitors?.filter((v) => !v.exit_time).length || 0
    const parents = visitors?.filter((v) => v.visitor_type === 'Parent').length || 0
    const guests = visitors?.filter((v) => v.visitor_type === 'Guest').length || 0
    return { today, inside, parents, guests }
  }, [visitors])

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, pass_number: `VP-${Date.now().toString().slice(-4)}` }); setModalOpen(true) }
  const openEdit = (v: Visitor) => { setEditing(v); setForm({ ...v }); setModalOpen(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form }
    if (editing) payload.id = editing.id
    await saveV.mutateAsync(payload as any)
    setModalOpen(false)
  }

  if (isLoading) return <LoadingSpinner label="Loading visitors..." />

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Visitor Management" description="Track all walk-in visitors to the library"
        actions={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={openAdd} className="btn-primary"><Plus size={16} /> New Visitor</button></>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatBox icon={Clock} label="Today's Visitors" value={stats.today} color="primary" />
        <StatBox icon={LogIn} label="Currently Inside" value={stats.inside} color="warning" />
        <StatBox icon={UserCheck} label="Parents" value={stats.parents} color="accent" />
        <StatBox icon={UserCheck} label="Guests" value={stats.guests} color="success" />
      </div>

      {visitors?.length === 0 ? (
        <EmptyState icon={UserCheck} title="No visitors yet" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr><th className="p-3 font-medium">Visitor</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Purpose</th><th className="p-3 font-medium">Host</th><th className="p-3 font-medium">Entry</th><th className="p-3 font-medium">Exit</th><th className="p-3 font-medium">Pass</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {(visitors || []).map((v, i) => (
                  <motion.tr key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                    <td className="p-3"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${avatarColor(v.name)} flex items-center justify-center text-white text-xs font-semibold`}>{initials(v.name)}</div><div><p className="font-medium text-gray-900 dark:text-white">{v.name}</p><p className="text-xs text-gray-500">{v.mobile}</p></div></div></td>
                    <td className="p-3"><span className={`badge ${v.visitor_type === 'Parent' ? 'badge-info' : v.visitor_type === 'Guest' ? 'badge-neutral' : 'badge-success'}`}>{v.visitor_type}</span></td>
                    <td className="p-3 text-gray-600 dark:text-slate-300">{v.purpose}</td>
                    <td className="p-3 text-gray-600 dark:text-slate-300">{v.host_name}</td>
                    <td className="p-3 text-gray-500">{formatDateTime(v.entry_time)}</td>
                    <td className="p-3 text-gray-500">{v.exit_time ? formatDateTime(v.exit_time) : '—'}</td>
                    <td className="p-3 font-mono text-xs text-gray-500">{v.pass_number}</td>
                    <td className="p-3"><span className={`badge ${v.exit_time ? 'badge-success' : 'badge-warning'}`}>{v.exit_time ? 'Exited' : 'Inside'}</span></td>
                    <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(v)} className="btn-ghost p-1.5"><Pencil size={14} /></button><button onClick={() => setDeleteId(v.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button></div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Visitor' : 'New Visitor'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Type</label><select className="input" value={form.visitor_type || 'Guest'} onChange={(e) => setForm({ ...form, visitor_type: e.target.value })}><option>Guest</option><option>Parent</option><option>Teacher</option><option>Student</option><option>Vendor</option></select></div>
            <div><label className="label">Mobile</label><input className="input" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Purpose</label><input className="input" value={form.purpose || ''} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
            <div><label className="label">Host Name</label><input className="input" value={form.host_name || ''} onChange={(e) => setForm({ ...form, host_name: e.target.value })} /></div>
            <div><label className="label">Pass Number</label><input className="input" value={form.pass_number || ''} onChange={(e) => setForm({ ...form, pass_number: e.target.value })} /></div>
          </div>
          {saveV.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(saveV.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saveV.isPending} className="btn-primary">{saveV.isPending ? 'Saving...' : editing ? 'Update' : 'Add Visitor'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteV.mutateAsync(deleteId) }} title="Delete Visitor" message="Delete this visitor record? This cannot be undone." />
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: 'primary' | 'warning' | 'accent' | 'success' }) {
  const colors = { primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600', warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-600', accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-600', success: 'bg-success-100 dark:bg-success-900/30 text-success-600' }
  return <div className="card p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={18} /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p><p className="text-xs text-gray-500">{label}</p></div></div>
}
