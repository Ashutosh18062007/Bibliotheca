import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, ArrowLeft, Star, Plus, ArrowLeftRight, Heart, Share2,
  MapPin, Calendar, IndianRupee, Tag, User,
} from 'lucide-react'
import { useBooks, useCirculation } from '@/lib/queries'
import { formatCurrency, formatDate, initials, avatarColor } from '@/lib/format'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: books, isLoading } = useBooks()
  const { data: circulation } = useCirculation()
  const book = books?.find((b) => b.id === id)
  const history = circulation?.filter((c) => c.book_id === id) || []

  if (isLoading) return <LoadingSpinner />
  if (!book) return <div className="p-6"><p>Book not found.</p><Link to="/books" className="btn-secondary mt-4">Back to catalog</Link></div>

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4"><ArrowLeft size={16} /> Back</button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card overflow-hidden sticky top-4">
            <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/40 dark:to-accent-900/40 flex items-center justify-center"><BookOpen size={80} className="text-primary-300 dark:text-primary-700" /></div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2"><button className="btn-primary flex-1"><ArrowLeftRight size={16} /> Issue</button><button className="btn-secondary"><Heart size={16} /></button><button className="btn-secondary"><Share2 size={16} /></button></div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50"><p className="text-lg font-bold text-gray-900 dark:text-white">{book.total_copies}</p><p className="text-[10px] text-gray-500">Total</p></div>
                <div className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20"><p className="text-lg font-bold text-success-600">{book.available_copies}</p><p className="text-[10px] text-success-600/70">Available</p></div>
                <div className="p-2 rounded-lg bg-warning-50 dark:bg-warning-900/20"><p className="text-lg font-bold text-warning-600">{book.issued_copies}</p><p className="text-[10px] text-warning-600/70">Issued</p></div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-2">
              {book.category && <span className="badge-info">{book.category}</span>}
              {book.subcategory && <span className="badge-neutral">{book.subcategory}</span>}
              <span className={`badge ${book.available_copies > 0 ? 'badge-success' : 'badge-error'}`}>{book.available_copies > 0 ? 'Available' : 'Out of stock'}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{book.title}</h1>
            {book.subtitle && <p className="text-gray-500 dark:text-slate-400 mt-1">{book.subtitle}</p>}
            <p className="text-sm text-gray-600 dark:text-slate-300 mt-2">by <span className="font-medium text-primary-600">{book.author}</span></p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} className={s <= Math.round(book.rating) ? 'text-warning-500 fill-warning-500' : 'text-gray-300'} />)}<span className="text-sm font-medium ml-1">{book.rating}</span></div>
              <span className="text-sm text-gray-400">({book.reviews_count} reviews)</span>
            </div>
            {book.description && <p className="text-sm text-gray-600 dark:text-slate-300 mt-4 leading-relaxed">{book.description}</p>}
            {book.tags && book.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{book.tags.map((t) => <span key={t} className="badge-neutral"><Tag size={10} /> {t}</span>)}</div>}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Book Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field icon={Tag} label="ISBN" value={book.isbn || '—'} />
              <Field icon={Tag} label="Barcode" value={book.barcode || '—'} />
              <Field icon={User} label="Publisher" value={book.publisher || '—'} />
              <Field icon={BookOpen} label="Edition" value={book.edition || '—'} />
              <Field icon={BookOpen} label="Language" value={book.language} />
              <Field icon={MapPin} label="Location" value={`${book.shelf || '—'} / ${book.rack || '—'} / ${book.location || '—'}`} />
              <Field icon={Calendar} label="Purchased" value={formatDate(book.purchase_date)} />
              <Field icon={User} label="Vendor" value={book.vendor || '—'} />
              <Field icon={IndianRupee} label="Cost" value={book.cost ? formatCurrency(book.cost) : '—'} />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Circulation History</h3>
            {history.length === 0 ? <p className="text-sm text-gray-500">No circulation records yet.</p> : (
              <div className="space-y-3">
                {history.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(c.member?.full_name || 'U')} flex items-center justify-center text-white text-xs font-semibold`}>{initials(c.member?.full_name || 'U')}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.member?.full_name}</p><p className="text-xs text-gray-500">Issued {formatDate(c.issue_date)} · Due {formatDate(c.due_date)}</p></div>
                    <span className={`badge ${c.status === 'returned' ? 'badge-success' : c.status === 'overdue' ? 'badge-error' : 'badge-warning'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return <div><p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5"><Icon size={12} /> {label}</p><p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 truncate">{value}</p></div>
}
