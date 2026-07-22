import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Search, FileText, Video, Presentation, BookOpen, Download, Bookmark, ThumbsUp, Plus, Star, Trash2, Pencil } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useBooks } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface KnowledgeItem {
  id: string; title: string; type: string; author: string; subject: string;
  description: string; downloads: number; likes: number; bookmarked: boolean;
}

const TYPE_ICONS: Record<string, typeof FileText> = { Article: FileText, PDF: FileText, Video: Video, Presentation: Presentation, Notes: BookOpen, Assignment: FileText }
const TYPE_COLORS: Record<string, string> = { Article: 'bg-primary-500', PDF: 'bg-error-500', Video: 'bg-accent-500', Presentation: 'bg-warning-500', Notes: 'bg-success-500', Assignment: 'bg-primary-700' }

const INITIAL: KnowledgeItem[] = [
  { id: 'k1', title: 'Introduction to Data Structures', type: 'Article', author: 'Dr. Meera Nair', subject: 'Computer Science', description: 'A comprehensive guide to arrays, linked lists, trees, and graphs.', downloads: 342, likes: 89, bookmarked: true },
  { id: 'k2', title: 'Quantum Mechanics — Lecture 5', type: 'Video', author: 'Prof. Arjun Reddy', subject: 'Physics', description: 'Video lecture covering Schrodinger equation basics.', downloads: 156, likes: 67, bookmarked: false },
  { id: 'k3', title: 'Linear Algebra Problem Set', type: 'Assignment', author: 'Dr. Kavya Rao', subject: 'Mathematics', description: '10 problems on eigenvalues and eigenvectors.', downloads: 210, likes: 45, bookmarked: true },
  { id: 'k4', title: 'Design Patterns Overview', type: 'Presentation', author: 'Dr. Meera Nair', subject: 'Computer Science', description: 'Slides covering Factory, Observer, Strategy patterns.', downloads: 489, likes: 134, bookmarked: false },
  { id: 'k5', title: 'Thermodynamics Notes', type: 'Notes', author: 'Prof. Arjun Reddy', subject: 'Physics', description: 'Complete chapter notes on thermodynamic laws.', downloads: 98, likes: 32, bookmarked: false },
  { id: 'k6', title: 'Calculus Cheat Sheet', type: 'PDF', author: 'Dr. Kavya Rao', subject: 'Mathematics', description: 'Quick reference for derivatives and integrals.', downloads: 678, likes: 201, bookmarked: true },
  { id: 'k7', title: 'Algorithms — Sorting Visualized', type: 'Video', author: 'Dr. Meera Nair', subject: 'Computer Science', description: 'Animated walkthrough of sorting algorithms.', downloads: 523, likes: 178, bookmarked: false },
  { id: 'k8', title: 'Research Methodology Guide', type: 'PDF', author: 'Dr. Meera Nair', subject: 'General', description: 'How to write research papers and cite sources.', downloads: 412, likes: 95, bookmarked: false },
]

export default function KnowledgeCenter() {
  const { data: books } = useBooks()
  const qc = useQueryClient()
  const [items, setItems] = useState<KnowledgeItem[]>(INITIAL)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<KnowledgeItem>>({ title: '', type: 'Article', author: '', subject: '', description: '' })

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const ms = !search || it.title.toLowerCase().includes(search.toLowerCase()) || it.author.toLowerCase().includes(search.toLowerCase())
      return ms && (type === 'all' || it.type === type)
    })
  }, [items, search, type])

  const toggleBookmark = (id: string) => setItems((prev) => prev.map((it) => it.id === id ? { ...it, bookmarked: !it.bookmarked } : it))

  const openAdd = () => { setEditing(null); setForm({ title: '', type: 'Article', author: '', subject: '', description: '' }); setModalOpen(true) }
  const openEdit = (it: KnowledgeItem) => { setEditing(it); setForm({ ...it }); setModalOpen(true) }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      setItems((prev) => prev.map((it) => it.id === editing.id ? { ...it, ...form } as KnowledgeItem : it))
    } else {
      const newItem: KnowledgeItem = { id: `k${Date.now()}`, title: form.title || '', type: form.type || 'Article', author: form.author || '', subject: form.subject || '', description: form.description || '', downloads: 0, likes: 0, bookmarked: false }
      setItems((prev) => [newItem, ...prev])
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    if (deleteId) { setItems((prev) => prev.filter((it) => it.id !== deleteId)); setDeleteId(null) }
  }

  const recommendations = (books || []).filter((b) => b.rating >= 4.5).slice(0, 4)

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Teacher Knowledge Center" description="Articles, research, notes, lectures & study materials"
        actions={<button onClick={openAdd} className="btn-primary"><Plus size={16} /> Upload Material</button>} />

      <div className="card p-5 mb-5 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center"><Search size={20} className="text-white" /></div>
          <div className="flex-1"><p className="font-semibold text-gray-900 dark:text-white">AI-Powered Search</p><p className="text-xs text-gray-500 dark:text-slate-400">Ask questions in natural language across all knowledge resources</p></div>
          <input className="input max-w-md" placeholder="Ask: 'How do binary search trees work?'" />
        </div>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="input md:w-48" value={type} onChange={(e) => setType(e.target.value)}><option value="all">All Types</option><option>Article</option><option>PDF</option><option>Video</option><option>Presentation</option><option>Notes</option><option>Assignment</option></select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((it, i) => {
            const Icon = TYPE_ICONS[it.type] || FileText
            return (
              <motion.div key={it.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} className="card card-hover p-4 group relative">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${TYPE_COLORS[it.type] || 'bg-gray-500'} flex items-center justify-center shrink-0`}><Icon size={18} className="text-white" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="badge-neutral">{it.type}</span><span className="badge-info">{it.subject}</span></div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white mt-1.5 line-clamp-2">{it.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">by {it.author}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{it.description}</p>
                  </div>
                  <button onClick={() => toggleBookmark(it.id)} className="text-gray-400 hover:text-warning-500"><Bookmark size={16} className={it.bookmarked ? 'fill-warning-500 text-warning-500' : ''} /></button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 text-xs text-gray-500"><span className="flex items-center gap-1"><Download size={12} /> {it.downloads}</span><span className="flex items-center gap-1"><ThumbsUp size={12} /> {it.likes}</span></div>
                  <div className="flex gap-1"><button className="btn-secondary text-xs px-2 py-1"><Download size={12} /> Download</button><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openEdit(it)} className="btn-ghost p-1"><Pencil size={14} /></button><button onClick={() => setDeleteId(it.id)} className="btn-ghost p-1 text-error-600"><Trash2 size={14} /></button></div></div>
                </div>
              </motion.div>
            )
          })}
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Star size={16} className="text-warning-500" /> Recommended Books</h3>
            <div className="space-y-2">
              {recommendations.map((b) => (
                <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <BookOpen size={14} className="text-primary-500 shrink-0" />
                  <div className="min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-white truncate">{b.title}</p><p className="text-[10px] text-gray-500">{b.author}</p></div>
                  <div className="flex items-center gap-0.5 ml-auto"><Star size={10} className="text-warning-500 fill-warning-500" /><span className="text-[10px]">{b.rating}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><GraduationCap size={16} className="text-primary-500" /> Categories</h3>
            <div className="flex flex-wrap gap-2">{['Computer Science', 'Physics', 'Mathematics', 'Biology', 'Arts', 'Commerce', 'General'].map((c) => <button key={c} className="badge-neutral hover:bg-primary-100 dark:hover:bg-primary-900/30 cursor-pointer">{c}</button>)}</div>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Upload Material'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Title *</label><input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label><select className="input" value={form.type || 'Article'} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Article</option><option>PDF</option><option>Video</option><option>Presentation</option><option>Notes</option><option>Assignment</option></select></div>
            <div><label className="label">Subject</label><input className="input" value={form.subject || ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          </div>
          <div><label className="label">Author</label><input className="input" value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{editing ? 'Update' : 'Upload'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Material" message="Delete this knowledge material? This cannot be undone." />
    </div>
  )
}
