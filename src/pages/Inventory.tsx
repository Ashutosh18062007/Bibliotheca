import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Plus, Search, Wrench, ShieldCheck, QrCode, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Asset {
  id: string; name: string; category: string; serial: string; status: string;
  location: string; warranty: string; value: number;
}

const INITIAL: Asset[] = [
  { id: 'a1', name: 'Dell OptiPlex 7090', category: 'Computer', serial: 'DLO7090-001', status: 'Active', location: 'Block A · Room 101', warranty: '2026-06-15', value: 45000 },
  { id: 'a2', name: 'HP LaserJet Pro M404', category: 'Printer', serial: 'HPL404-002', status: 'Active', location: 'Block B · Office', warranty: '2025-08-01', value: 18000 },
  { id: 'a3', name: 'RFID Reader Impinj R420', category: 'RFID Device', serial: 'IMP420-003', status: 'Active', location: 'Library Hall', warranty: '2025-11-20', value: 85000 },
  { id: 'a4', name: 'Honeywell Scanner 1900', category: 'Scanner', serial: 'HW1900-004', status: 'Maintenance', location: 'Circulation Desk', warranty: '2024-03-10', value: 12000 },
  { id: 'a5', name: 'Steel Bookshelf (3m)', category: 'Furniture', serial: 'BF3M-005', status: 'Active', location: 'Block A · Rack Row 1', warranty: '2031-01-05', value: 22000 },
  { id: 'a6', name: 'Server Rack 42U', category: 'Furniture', serial: 'SR42U-007', status: 'Active', location: 'Server Room', warranty: '2032-09-01', value: 120000 },
]

const STATUS_BADGE: Record<string, string> = { Active: 'badge-success', Maintenance: 'badge-warning', Retired: 'badge-neutral' }
const EMPTY: Partial<Asset> = { name: '', category: 'Computer', serial: '', status: 'Active', location: '', warranty: '', value: 0 }

export default function Inventory() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Asset>>(EMPTY)

  const totalValue = assets.reduce((s, a) => s + a.value, 0)
  const active = assets.filter((a) => a.status === 'Active').length
  const maintenance = assets.filter((a) => a.status === 'Maintenance').length

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (a: Asset) => { setEditing(a); setForm({ ...a }); setModalOpen(true) }
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) { setAssets((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } as Asset : a)) } 
    else { setAssets((prev) => [{ ...form, id: `a${Date.now()}` } as Asset, ...prev]) }
    setModalOpen(false)
  }
  const handleDelete = () => { if (deleteId) { setAssets((prev) => prev.filter((a) => a.id !== deleteId)); setDeleteId(null) } }

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Inventory Management" description="Track assets, equipment, and maintenance"
        actions={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Asset</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><Package size={18} className="text-primary-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{assets.length}</p><p className="text-xs text-gray-500">Total Assets</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center"><ShieldCheck size={18} className="text-success-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{active}</p><p className="text-xs text-gray-500">Active</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center"><Wrench size={18} className="text-warning-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">{maintenance}</p><p className="text-xs text-gray-500">In Maintenance</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center"><Package size={18} className="text-accent-600" /></div><div><p className="text-xl font-bold text-gray-900 dark:text-white">₹{totalValue.toLocaleString('en-IN')}</p><p className="text-xs text-gray-500">Total Value</p></div></div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1 max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search assets..." /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr><th className="p-3 font-medium">Asset</th><th className="p-3 font-medium">Category</th><th className="p-3 font-medium">Serial</th><th className="p-3 font-medium">Location</th><th className="p-3 font-medium">Warranty</th><th className="p-3 font-medium">Value</th><th className="p-3 font-medium">QR</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Actions</th></tr>
            </thead>
            <tbody>
              {assets.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{a.name}</td>
                  <td className="p-3"><span className="badge-info">{a.category}</span></td>
                  <td className="p-3 font-mono text-xs text-gray-500">{a.serial}</td>
                  <td className="p-3 text-gray-600 dark:text-slate-300">{a.location}</td>
                  <td className="p-3 text-gray-500">{a.warranty}</td>
                  <td className="p-3 text-gray-600 dark:text-slate-300">₹{a.value.toLocaleString('en-IN')}</td>
                  <td className="p-3"><QrCode size={16} className="text-gray-400" /></td>
                  <td className="p-3"><span className={`badge ${STATUS_BADGE[a.status] || 'badge-neutral'}`}>{a.status}</span></td>
                  <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(a)} className="btn-ghost p-1.5"><Pencil size={14} /></button><button onClick={() => setDeleteId(a.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button></div></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Asset' : 'Add Asset'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">Category</label><select className="input" value={form.category || 'Computer'} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Computer</option><option>Printer</option><option>RFID Device</option><option>Scanner</option><option>Furniture</option><option>Other</option></select></div>
            <div><label className="label">Serial Number</label><input className="input" value={form.serial || ''} onChange={(e) => setForm({ ...form, serial: e.target.value })} /></div>
            <div><label className="label">Status</label><select className="input" value={form.status || 'Active'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Maintenance</option><option>Retired</option></select></div>
            <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="label">Warranty Until</label><input className="input" value={form.warranty || ''} onChange={(e) => setForm({ ...form, warranty: e.target.value })} /></div>
            <div><label className="label">Value (₹)</label><input type="number" className="input" value={form.value || 0} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Add Asset'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Asset" message="Delete this asset record? This cannot be undone." />
    </div>
  )
}
