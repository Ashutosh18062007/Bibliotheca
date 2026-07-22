import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, Plus, Download, CheckCircle2, Clock, AlertCircle, Trash2, Pencil } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useFines, useMembers, useSaveFine, useDeleteFine } from '@/lib/queries'
import { formatCurrency, formatDateTime, initials, avatarColor } from '@/lib/format'
import type { Fine } from '@/types'

export default function Fines() {
  const { data: fines, isLoading } = useFines()
  const { data: members } = useMembers()
  const saveFine = useSaveFine()
  const deleteFine = useDeleteFine()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Fine> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Fine>>({ member_id: '', amount: 0, reason: 'Overdue return', status: 'pending' })

  const stats = useMemo(() => {
    const total = fines?.reduce((s, f) => s + Number(f.amount), 0) || 0
    const pending = fines?.filter((f) => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0) || 0
    const collected = fines?.filter((f) => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0) || 0
    return { total, pending, collected, count: fines?.length || 0 }
  }, [fines])

  const openAdd = () => { setEditing(null); setForm({ member_id: '', amount: 0, reason: 'Overdue return', status: 'pending' }); setModalOpen(true) }
  const openEdit = (f: Fine) => { setEditing(f); setForm({ ...f }); setModalOpen(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, amount: Number(form.amount) }
    if (editing) payload.id = editing.id
    await saveFine.mutateAsync(payload as any)
    setModalOpen(false)
  }

  const handleCollect = async (id: string) => {
    await saveFine.mutateAsync({ id, status: 'paid' } as any)
  }

  if (isLoading) return <LoadingSpinner label="Loading fines..." />

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Fines & Penalties" description="Manage overdue and lost book fines"
        actions={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Fine</button></>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><IndianRupee size={18} className="text-primary-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total)}</p><p className="text-xs text-gray-500">Total Fines</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center"><Clock size={18} className="text-warning-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.pending)}</p><p className="text-xs text-gray-500">Pending</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center"><CheckCircle2 size={18} className="text-success-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.collected)}</p><p className="text-xs text-gray-500">Collected</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center"><AlertCircle size={18} className="text-error-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.count}</p><p className="text-xs text-gray-500">Total Records</p></div></div>
      </div>

      {fines?.length === 0 ? (
        <EmptyState icon={IndianRupee} title="No fines recorded" description="All clear — no outstanding fines" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr><th className="p-3 font-medium">Member</th><th className="p-3 font-medium">Reason</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Created</th><th className="p-3 font-medium">Paid Date</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {(fines || []).map((f, i) => (
                  <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                    <td className="p-3"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${avatarColor(f.member?.full_name || 'U')} flex items-center justify-center text-white text-xs font-semibold`}>{initials(f.member?.full_name || 'U')}</div><span className="font-medium text-gray-900 dark:text-white">{f.member?.full_name}</span></div></td>
                    <td className="p-3 text-gray-600 dark:text-slate-300">{f.reason}</td>
                    <td className="p-3 font-semibold text-error-600">{formatCurrency(f.amount)}</td>
                    <td className="p-3 text-gray-500">{formatDateTime(f.created_at)}</td>
                    <td className="p-3 text-gray-500">{f.paid_date ? formatDateTime(f.paid_date) : '—'}</td>
                    <td className="p-3"><span className={`badge ${f.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{f.status}</span></td>
                    <td className="p-3"><div className="flex gap-1">{f.status === 'pending' && <button onClick={() => handleCollect(f.id)} className="btn-primary text-xs px-2 py-1">Collect</button>}<button onClick={() => openEdit(f)} className="btn-ghost p-1.5"><Pencil size={14} /></button><button onClick={() => setDeleteId(f.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button></div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Fine' : 'Add Fine'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Member *</label><select className="input" value={form.member_id || ''} onChange={(e) => setForm({ ...form, member_id: e.target.value })} required><option value="">Choose a member...</option>{(members || []).map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.card_number})</option>)}</select></div>
          <div><label className="label">Reason</label><input className="input" value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div><label className="label">Amount (₹) *</label><input type="number" step="0.01" min={0} className="input" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required /></div>
          <div><label className="label">Status</label><select className="input" value={form.status || 'pending'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="paid">Paid</option><option value="waived">Waived</option></select></div>
          {saveFine.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(saveFine.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saveFine.isPending} className="btn-primary">{saveFine.isPending ? 'Saving...' : editing ? 'Update Fine' : 'Add Fine'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteFine.mutateAsync(deleteId) }} title="Delete Fine" message="Delete this fine record? This cannot be undone." />
    </div>
  )
}
