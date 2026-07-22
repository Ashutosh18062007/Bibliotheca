import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Search, Plus, Download, GraduationCap, UserCircle, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useMembers, useSaveMember, useDeleteMember } from '@/lib/queries'
import { initials, avatarColor, formatDate } from '@/lib/format'
import type { Member } from '@/types'

const ROLES = ['Student', 'Teacher', 'Librarian', 'Accountant', 'Principal', 'Library Head', 'Admin', 'Receptionist', 'Parent', 'Guest']

const EMPTY: Partial<Member> = {
  full_name: '', role: 'Student', email: '', mobile: '', gender: '', card_number: '',
  member_id: '', class_name: '', section: '', roll_number: '', department: '', designation: '',
  father_name: '', mother_name: '', guardian_name: '', guardian_mobile: '', address: '',
  city: '', state: '', pin_code: '', emergency_contact: '', status: 'active',
}

export default function Members() {
  const { data: members, isLoading } = useMembers()
  const saveMember = useSaveMember()
  const deleteMember = useDeleteMember()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Member> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Member>>(EMPTY)

  const roles = useMemo(() => {
    const set = new Set(members?.map((m) => m.role).filter(Boolean) as string[])
    return ['all', ...Array.from(set)]
  }, [members])

  const filtered = useMemo(() => {
    return (members || []).filter((m) => {
      const ms = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.card_number.toLowerCase().includes(search.toLowerCase()) || (m.email || '').toLowerCase().includes(search.toLowerCase())
      return ms && (role === 'all' || m.role === role)
    })
  }, [members, search, role])

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, member_id: `M${Date.now()}`, card_number: `LIB-${Date.now().toString().slice(-6)}` }); setModalOpen(true) }
  const openEdit = (m: Member) => { setEditing(m); setForm({ ...m }); setModalOpen(true) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form }
    if (editing) payload.id = editing.id
    await saveMember.mutateAsync(payload as any)
    setModalOpen(false)
  }

  if (isLoading) return <LoadingSpinner label="Loading members..." />

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Members" description={`${members?.length || 0} registered members`}
        actions={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Member</button></>} />

      <div className="card p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search by name, card number, email..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="input md:w-48" value={role} onChange={(e) => setRole(e.target.value)}>{roles.map((r) => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r}</option>)}</select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
              <div className="card card-hover p-5 group relative">
                <Link to={`/members/${m.id}`} className="block">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full ${avatarColor(m.full_name)} flex items-center justify-center text-white font-semibold shrink-0`}>{initials(m.full_name)}</div>
                    <div className="min-w-0 flex-1"><h3 className="font-semibold text-gray-900 dark:text-white truncate">{m.full_name}</h3><p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{m.card_number}</p></div>
                    <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{m.status}</span>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs">
                    <p className="text-gray-600 dark:text-slate-300 flex items-center gap-1.5"><UserCircle size={12} /> {m.role}</p>
                    {m.class_name && <p className="text-gray-500 flex items-center gap-1.5"><GraduationCap size={12} /> Class {m.class_name}</p>}
                    {m.department && <p className="text-gray-500 flex items-center gap-1.5"><GraduationCap size={12} /> {m.department}</p>}
                    <p className="text-gray-500 flex items-center gap-1.5"><Users size={12} /> Joined {formatDate(m.admission_date)}</p>
                  </div>
                </Link>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-gray-600 hover:text-primary-600"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(m.id)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-gray-600 hover:text-error-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'Add New Member'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label><input className="input" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div><label className="label">Role</label><select className="input" value={form.role || 'Student'} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Mobile</label><input className="input" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
            <div><label className="label">Gender</label><select className="input" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div><label className="label">Status</label><select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option></select></div>
            <div><label className="label">Card Number</label><input className="input" value={form.card_number || ''} onChange={(e) => setForm({ ...form, card_number: e.target.value })} /></div>
            <div><label className="label">Member ID</label><input className="input" value={form.member_id || ''} onChange={(e) => setForm({ ...form, member_id: e.target.value })} /></div>
            <div><label className="label">Class</label><input className="input" value={form.class_name || ''} onChange={(e) => setForm({ ...form, class_name: e.target.value })} /></div>
            <div><label className="label">Section</label><input className="input" value={form.section || ''} onChange={(e) => setForm({ ...form, section: e.target.value })} /></div>
            <div><label className="label">Roll Number</label><input className="input" value={form.roll_number || ''} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} /></div>
            <div><label className="label">Department</label><input className="input" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><label className="label">Father's Name</label><input className="input" value={form.father_name || ''} onChange={(e) => setForm({ ...form, father_name: e.target.value })} /></div>
            <div><label className="label">Mother's Name</label><input className="input" value={form.mother_name || ''} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} /></div>
            <div><label className="label">Guardian Name</label><input className="input" value={form.guardian_name || ''} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} /></div>
            <div><label className="label">Guardian Mobile</label><input className="input" value={form.guardian_mobile || ''} onChange={(e) => setForm({ ...form, guardian_mobile: e.target.value })} /></div>
            <div><label className="label">City</label><input className="input" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="label">State</label><input className="input" value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><label className="label">PIN Code</label><input className="input" value={form.pin_code || ''} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} /></div>
            <div><label className="label">Emergency Contact</label><input className="input" value={form.emergency_contact || ''} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
          </div>
          <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          {saveMember.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(saveMember.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMember.isPending} className="btn-primary">{saveMember.isPending ? 'Saving...' : editing ? 'Update Member' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteMember.mutateAsync(deleteId) }} title="Delete Member" message="Are you sure you want to delete this member? This action cannot be undone." />
    </div>
  )
}
