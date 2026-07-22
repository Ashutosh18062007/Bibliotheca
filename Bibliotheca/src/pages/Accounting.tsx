import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, Plus, Download, ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'

interface Transaction {
  id: string; type: 'income' | 'expense'; category: string; description: string;
  amount: number; date: string; payment_method: string; reference: string; created_at: string
}

const EMPTY: Partial<Transaction> = { type: 'income', category: '', description: '', amount: 0, date: new Date().toISOString().slice(0, 10), payment_method: 'Cash', reference: '' }

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
      if (error) throw error
      return data as Transaction[]
    },
  })
}

export function useSaveTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tx: Partial<Transaction>) => {
      if (tx.id) {
        const { id, created_at, ...updates } = tx
        const { data, error } = await supabase.from('transactions').update(updates).eq('id', tx.id).select().single()
        if (error) throw error
        return data
      }
      const { created_at, id, ...insert } = tx
      const { data, error } = await supabase.from('transactions').insert(insert).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => { await supabase.from('transactions').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export default function Accounting() {
  const { data: transactions, isLoading } = useTransactions()
  const saveTx = useSaveTransaction()
  const deleteTx = useDeleteTransaction()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Transaction>>(EMPTY)

  const stats = useMemo(() => {
    const income = transactions?.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0
    const expense = transactions?.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0
    return { income, expense, balance: income - expense }
  }, [transactions])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (t: Transaction) => { setEditing(t); setForm({ ...t }); setModalOpen(true) }
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, amount: Number(form.amount) }
    if (editing) payload.id = editing.id
    await saveTx.mutateAsync(payload as any)
    setModalOpen(false)
  }

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading transactions...</div>

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Accounting & Finance" description="Track income, expenses, and financial health"
        actions={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Transaction</button></>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-900/10 border-success-200 dark:border-success-800">
          <div className="flex items-center justify-between"><div><p className="text-xs text-success-700 dark:text-success-400 font-medium">Total Income</p><p className="text-2xl font-bold text-success-700 dark:text-success-300 mt-1">{formatCurrency(stats.income)}</p></div><div className="w-12 h-12 rounded-xl bg-success-500 flex items-center justify-center"><TrendingUp size={22} className="text-white" /></div></div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900/20 dark:to-error-900/10 border-error-200 dark:border-error-800">
          <div className="flex items-center justify-between"><div><p className="text-xs text-error-700 dark:text-error-400 font-medium">Total Expense</p><p className="text-2xl font-bold text-error-700 dark:text-error-300 mt-1">{formatCurrency(stats.expense)}</p></div><div className="w-12 h-12 rounded-xl bg-error-500 flex items-center justify-center"><TrendingDown size={22} className="text-white" /></div></div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between"><div><p className="text-xs text-primary-700 dark:text-primary-400 font-medium">Net Balance</p><p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">{formatCurrency(stats.balance)}</p></div><div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center"><Wallet size={22} className="text-white" /></div></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800"><h3 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
              <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Category</th><th className="p-3 font-medium">Description</th><th className="p-3 font-medium">Method</th><th className="p-3 font-medium">Reference</th><th className="p-3 font-medium text-right">Amount</th><th className="p-3 font-medium">Actions</th></tr>
            </thead>
            <tbody>
              {(transactions || []).map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.4) }} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                  <td className="p-3 text-gray-500">{formatDate(t.date)}</td>
                  <td className="p-3"><span className={`inline-flex items-center gap-1 badge ${t.type === 'income' ? 'badge-success' : 'badge-error'}`}>{t.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{t.type}</span></td>
                  <td className="p-3 font-medium text-gray-900 dark:text-white">{t.category}</td>
                  <td className="p-3 text-gray-600 dark:text-slate-300">{t.description}</td>
                  <td className="p-3 text-gray-500">{t.payment_method}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{t.reference || '—'}</td>
                  <td className={`p-3 text-right font-semibold ${t.type === 'income' ? 'text-success-600' : 'text-error-600'}`}>{t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}</td>
                  <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(t)} className="btn-ghost p-1.5"><Pencil size={14} /></button><button onClick={() => setDeleteId(t.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button></div></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Transaction' : 'Add Transaction'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type *</label><select className="input" value={form.type || 'income'} onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}><option value="income">Income</option><option value="expense">Expense</option></select></div>
            <div><label className="label">Amount (₹) *</label><input type="number" step="0.01" min={0} className="input" value={form.amount || 0} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required /></div>
            <div><label className="label">Category *</label><input className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} required /></div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className="label">Payment Method</label><select className="input" value={form.payment_method || 'Cash'} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}><option>Cash</option><option>Card</option><option>Bank Transfer</option><option>UPI</option><option>Cheque</option></select></div>
            <div><label className="label">Reference</label><input className="input" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {saveTx.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(saveTx.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saveTx.isPending} className="btn-primary">{saveTx.isPending ? 'Saving...' : editing ? 'Update' : 'Add Transaction'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteTx.mutateAsync(deleteId) }} title="Delete Transaction" message="Delete this transaction? This cannot be undone." />
    </div>
  )
}
