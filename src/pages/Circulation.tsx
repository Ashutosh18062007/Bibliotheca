import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Search, Plus, BookOpen, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import { useCirculation, useBooks, useMembers, useIssueBook, useReturnBook } from '@/lib/queries'
import { formatDateTime, formatDate, initials, avatarColor } from '@/lib/format'

export default function Circulation() {
  const { data: circulation, isLoading } = useCirculation()
  const { data: books } = useBooks()
  const { data: members } = useMembers()
  const issueBook = useIssueBook()
  const returnBook = useReturnBook()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [issueModal, setIssueModal] = useState(false)
  const [selBook, setSelBook] = useState('')
  const [selMember, setSelMember] = useState('')
  const [dueDays, setDueDays] = useState(14)

  const filtered = useMemo(() => {
    return (circulation || []).filter((c) => {
      const ms = !search || (c.book?.title || '').toLowerCase().includes(search.toLowerCase()) || (c.member?.full_name || '').toLowerCase().includes(search.toLowerCase())
      return ms && (status === 'all' || c.status === status)
    })
  }, [circulation, search, status])

  const stats = useMemo(() => ({
    issued: circulation?.filter((c) => c.status === 'issued').length || 0,
    overdue: circulation?.filter((c) => c.status === 'overdue').length || 0,
    returned: circulation?.filter((c) => c.status === 'returned').length || 0,
  }), [circulation])

  const availableBooks = (books || []).filter((b) => b.available_copies > 0)
  const activeMembers = (members || []).filter((m) => m.status === 'active')

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selBook || !selMember) return
    await issueBook.mutateAsync({ book_id: selBook, member_id: selMember, due_days: dueDays })
    setIssueModal(false); setSelBook(''); setSelMember(''); setDueDays(14)
  }

  const handleReturn = async (circId: string, bookId: string) => {
    await returnBook.mutateAsync({ circulation_id: circId, book_id: bookId })
  }

  if (isLoading) return <LoadingSpinner label="Loading circulation..." />

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Circulation" description="Book issue and return transactions"
        actions={<button onClick={() => setIssueModal(true)} className="btn-primary"><Plus size={16} /> New Issue</button>} />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center"><Clock size={18} className="text-warning-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.issued}</p><p className="text-xs text-gray-500">Issued</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center"><AlertTriangle size={18} className="text-error-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p><p className="text-xs text-gray-500">Overdue</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center"><CheckCircle2 size={18} className="text-success-600" /></div><div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.returned}</p><p className="text-xs text-gray-500">Returned</p></div></div>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search by book or member..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="input md:w-48" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All Status</option><option value="issued">Issued</option><option value="overdue">Overdue</option><option value="returned">Returned</option></select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transactions found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr><th className="p-3 font-medium">Member</th><th className="p-3 font-medium">Book</th><th className="p-3 font-medium">Issued</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium">Returned</th><th className="p-3 font-medium">Fine</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Action</th></tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.4) }} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                    <td className="p-3"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full ${avatarColor(c.member?.full_name || 'U')} flex items-center justify-center text-white text-xs font-semibold`}>{initials(c.member?.full_name || 'U')}</div><span className="font-medium text-gray-900 dark:text-white">{c.member?.full_name}</span></div></td>
                    <td className="p-3"><div className="flex items-center gap-2"><BookOpen size={14} className="text-primary-500 shrink-0" /><span className="text-gray-700 dark:text-slate-300">{c.book?.title}</span></div></td>
                    <td className="p-3 text-gray-500">{formatDate(c.issue_date)}</td>
                    <td className="p-3 text-gray-500">{formatDate(c.due_date)}</td>
                    <td className="p-3 text-gray-500">{c.return_date ? formatDate(c.return_date) : '—'}</td>
                    <td className="p-3 text-error-600 font-medium">{c.fine_amount > 0 ? `₹${c.fine_amount}` : '—'}</td>
                    <td className="p-3"><span className={`badge ${c.status === 'returned' ? 'badge-success' : c.status === 'overdue' ? 'badge-error' : 'badge-warning'}`}>{c.status}</span></td>
                    <td className="p-3">{c.status !== 'returned' ? <button onClick={() => handleReturn(c.id, c.book_id)} disabled={returnBook.isPending} className="btn-secondary text-xs px-2 py-1">Return</button> : <span className="text-xs text-gray-400">Completed</span>}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      <Modal open={issueModal} onClose={() => setIssueModal(false)} title="Issue Book" size="md">
        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="label">Select Book *</label>
            <select className="input" value={selBook} onChange={(e) => setSelBook(e.target.value)} required>
              <option value="">Choose a book...</option>
              {availableBooks.map((b) => <option key={b.id} value={b.id}>{b.title} by {b.author} ({b.available_copies} available)</option>)}
            </select>
          </div>
          <div>
            <label className="label">Select Member *</label>
            <select className="input" value={selMember} onChange={(e) => setSelMember(e.target.value)} required>
              <option value="">Choose a member...</option>
              {activeMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name} ({m.card_number}) — {m.role}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due After (days)</label>
            <input type="number" min={1} max={90} className="input" value={dueDays} onChange={(e) => setDueDays(parseInt(e.target.value) || 14)} />
          </div>
          {availableBooks.length === 0 && <div className="p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 text-warning-700 text-sm">No books currently available for issue.</div>}
          {issueBook.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(issueBook.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIssueModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={issueBook.isPending} className="btn-primary">{issueBook.isPending ? 'Issuing...' : 'Issue Book'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
