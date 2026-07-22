import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Search, Plus, Filter, Star, Download, Grid3x3, List, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useBooks, useSaveBook, useDeleteBook } from '@/lib/queries'
import { formatCurrency } from '@/lib/format'
import type { Book } from '@/types'

const EMPTY: Partial<Book> = {
  title: '', author: '', isbn: '', barcode: '', publisher: '', edition: '',
  language: 'English', category: '', subcategory: '', shelf: '', rack: '', location: '',
  total_copies: 1, cost: 0, rating: 0, reviews_count: 0, description: '', tags: [],
  status: 'available',
}

export default function Books() {
  const { data: books, isLoading } = useBooks()
  const saveBook = useSaveBook()
  const deleteBook = useDeleteBook()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Book> | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Book>>(EMPTY)
  const [tagsInput, setTagsInput] = useState('')

  const categories = useMemo(() => {
    const set = new Set(books?.map((b) => b.category).filter(Boolean) as string[])
    return ['all', ...Array.from(set)]
  }, [books])

  const filtered = useMemo(() => {
    return (books || []).filter((b) => {
      const ms = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || (b.isbn || '').includes(search) || (b.barcode || '').includes(search)
      return ms && (category === 'all' || b.category === category)
    })
  }, [books, search, category])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setTagsInput(''); setModalOpen(true) }
  const openEdit = (book: Book) => {
    setEditing(book); setForm({ ...book }); setTagsInput((book.tags || []).join(', ')); setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean) }
    if (editing) payload.id = editing.id
    await saveBook.mutateAsync(payload as any)
    setModalOpen(false)
  }

  if (isLoading) return <LoadingSpinner label="Loading catalog..." />

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Book Catalog" description={`${books?.length || 0} titles in your library`}
        actions={<><button className="btn-secondary"><Download size={16} /> Export</button><button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Book</button></>} />

      <div className="card p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search by title, author, ISBN, barcode..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="input md:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}</select>
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setView('grid')} className={`p-2.5 ${view === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}><Grid3x3 size={18} /></button>
            <button onClick={() => setView('list')} className={`p-2.5 ${view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500'}`}><List size={18} /></button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No books found" description="Try adjusting your search or add a new book" />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book, i) => (
            <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}>
              <div className="card card-hover overflow-hidden group relative">
                <Link to={`/books/${book.id}`}>
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center p-4"><BookOpen size={48} className="text-primary-300 dark:text-primary-700" /></div>
                    <div className="absolute top-2 right-2"><span className={`badge ${book.available_copies > 0 ? 'badge-success' : 'badge-error'}`}>{book.available_copies > 0 ? `${book.available_copies} avail` : 'Out'}</span></div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium truncate">{book.category}</p>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mt-0.5 group-hover:text-primary-600 transition-colors">{book.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">by {book.author}</p>
                    <div className="flex items-center justify-between mt-2"><div className="flex items-center gap-0.5"><Star size={12} className="text-warning-500 fill-warning-500" /><span className="text-xs font-medium text-gray-700 dark:text-slate-300">{book.rating}</span></div><span className="text-xs text-gray-400">{book.available_copies}/{book.total_copies}</span></div>
                  </div>
                </Link>
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); openEdit(book) }} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-gray-600 hover:text-primary-600"><Pencil size={14} /></button>
                  <button onClick={(e) => { e.preventDefault(); setDeleteId(book.id) }} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-gray-600 hover:text-error-600"><Trash2 size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/50 text-left text-xs uppercase text-gray-500 dark:text-slate-400">
                <tr><th className="p-3 font-medium">Title</th><th className="p-3 font-medium">Author</th><th className="p-3 font-medium">Category</th><th className="p-3 font-medium">ISBN</th><th className="p-3 font-medium">Available</th><th className="p-3 font-medium">Rating</th><th className="p-3 font-medium">Cost</th><th className="p-3 font-medium">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((book) => (
                  <tr key={book.id} className="border-t border-gray-100 dark:border-slate-800 table-row-hover">
                    <td className="p-3"><Link to={`/books/${book.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600">{book.title}</Link></td>
                    <td className="p-3 text-gray-600 dark:text-slate-300">{book.author}</td>
                    <td className="p-3"><span className="badge-info">{book.category}</span></td>
                    <td className="p-3 text-gray-500 font-mono text-xs">{book.isbn || '—'}</td>
                    <td className="p-3"><span className={`badge ${book.available_copies > 0 ? 'badge-success' : 'badge-error'}`}>{book.available_copies}/{book.total_copies}</span></td>
                    <td className="p-3"><div className="flex items-center gap-0.5"><Star size={12} className="text-warning-500 fill-warning-500" /><span>{book.rating}</span></div></td>
                    <td className="p-3 text-gray-600 dark:text-slate-300">{book.cost ? formatCurrency(book.cost) : '—'}</td>
                    <td className="p-3"><div className="flex gap-1"><button onClick={() => openEdit(book)} className="btn-ghost p-1.5"><Pencil size={14} /></button><button onClick={() => setDeleteId(book.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Book' : 'Add New Book'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Title *</label><input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="label">Author *</label><input className="input" value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} required /></div>
            <div><label className="label">ISBN</label><input className="input" value={form.isbn || ''} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
            <div><label className="label">Barcode</label><input className="input" value={form.barcode || ''} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
            <div><label className="label">Publisher</label><input className="input" value={form.publisher || ''} onChange={(e) => setForm({ ...form, publisher: e.target.value })} /></div>
            <div><label className="label">Edition</label><input className="input" value={form.edition || ''} onChange={(e) => setForm({ ...form, edition: e.target.value })} /></div>
            <div><label className="label">Language</label><input className="input" value={form.language || 'English'} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
            <div><label className="label">Category</label><input className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className="label">Subcategory</label><input className="input" value={form.subcategory || ''} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} /></div>
            <div><label className="label">Total Copies</label><input type="number" min={1} className="input" value={form.total_copies || 1} onChange={(e) => setForm({ ...form, total_copies: parseInt(e.target.value) || 1 })} /></div>
            <div><label className="label">Shelf</label><input className="input" value={form.shelf || ''} onChange={(e) => setForm({ ...form, shelf: e.target.value })} /></div>
            <div><label className="label">Rack</label><input className="input" value={form.rack || ''} onChange={(e) => setForm({ ...form, rack: e.target.value })} /></div>
            <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="label">Cost (₹)</label><input type="number" step="0.01" className="input" value={form.cost || 0} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} /></div>
            <div><label className="label">Vendor</label><input className="input" value={form.vendor || ''} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
            <div><label className="label">Rating (0-5)</label><input type="number" step="0.1" min={0} max={5} className="input" value={form.rating || 0} onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <div><label className="label">Tags (comma-separated)</label><input className="input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="programming, best-practices" /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {saveBook.isError && <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 text-sm">{(saveBook.error as Error).message}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveBook.isPending} className="btn-primary">{saveBook.isPending ? 'Saving...' : editing ? 'Update Book' : 'Add Book'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await deleteBook.mutateAsync(deleteId) }} title="Delete Book" message="Are you sure you want to delete this book? This action cannot be undone." />
    </div>
  )
}
