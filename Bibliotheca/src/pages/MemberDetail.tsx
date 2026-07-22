import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, GraduationCap, BookOpen, IndianRupee } from 'lucide-react'
import { useMembers, useCirculation, useFines } from '@/lib/queries'
import { formatCurrency, formatDate, formatDateTime, initials, avatarColor } from '@/lib/format'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function MemberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: members, isLoading } = useMembers()
  const { data: circulation } = useCirculation()
  const { data: fines } = useFines()
  const member = members?.find((m) => m.id === id)
  const history = circulation?.filter((c) => c.member_id === id) || []
  const memberFines = fines?.filter((f) => f.member_id === id) || []
  const activeLoans = history.filter((c) => c.status === 'issued' || c.status === 'overdue')
  const pendingFines = memberFines.filter((f) => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0)

  if (isLoading) return <LoadingSpinner />
  if (!member) return <div className="p-6"><p>Member not found.</p><Link to="/members" className="btn-secondary mt-4">Back</Link></div>

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4"><ArrowLeft size={16} /> Back</button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-4">
            <div className="flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full ${avatarColor(member.full_name)} flex items-center justify-center text-white text-2xl font-bold`}>{initials(member.full_name)}</div>
              <h2 className="font-display text-xl font-bold mt-3 text-gray-900 dark:text-white">{member.full_name}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">{member.role}</p>
              <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-neutral'} mt-2`}>{member.status}</span>
            </div>
            <div className="mt-6 space-y-3">
              <InfoRow icon={User} label="Card Number" value={member.card_number} />
              <InfoRow icon={Mail} label="Email" value={member.email || '—'} />
              <InfoRow icon={Phone} label="Mobile" value={member.mobile || '—'} />
              {member.class_name && <InfoRow icon={GraduationCap} label="Class" value={`${member.class_name}${member.section ? ' · ' + member.section : ''}`} />}
              {member.department && <InfoRow icon={GraduationCap} label="Department" value={member.department} />}
              {member.designation && <InfoRow icon={User} label="Designation" value={member.designation} />}
              <InfoRow icon={Calendar} label="Joined" value={formatDate(member.admission_date)} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-center"><p className="text-xl font-bold text-primary-600">{activeLoans.length}</p><p className="text-[10px] text-primary-600/70">Active Loans</p></div>
              <div className="p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-center"><p className="text-xl font-bold text-error-600">{formatCurrency(pendingFines)}</p><p className="text-[10px] text-error-600/70">Pending Fines</p></div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Personal & Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={User} label="Father" value={member.father_name || '—'} />
              <InfoRow icon={User} label="Mother" value={member.mother_name || '—'} />
              <InfoRow icon={User} label="Guardian" value={member.guardian_name || '—'} />
              <InfoRow icon={Phone} label="Guardian Mobile" value={member.guardian_mobile || '—'} />
              <InfoRow icon={Phone} label="Emergency" value={member.emergency_contact || '—'} />
              <InfoRow icon={MapPin} label="City" value={`${member.city || '—'}, ${member.state || ''}`} />
              <InfoRow icon={MapPin} label="Address" value={member.address || '—'} />
              <InfoRow icon={MapPin} label="PIN" value={member.pin_code || '—'} />
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Loans</h3>
            {activeLoans.length === 0 ? <p className="text-sm text-gray-500">No active loans.</p> : (
              <div className="space-y-3">
                {activeLoans.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><BookOpen size={16} className="text-primary-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.book?.title}</p><p className="text-xs text-gray-500">Due {formatDate(c.due_date)}</p></div>
                    <span className={`badge ${c.status === 'overdue' ? 'badge-error' : 'badge-warning'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Fines History</h3>
            {memberFines.length === 0 ? <p className="text-sm text-gray-500">No fines recorded.</p> : (
              <div className="space-y-3">
                {memberFines.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <div className="w-9 h-9 rounded-lg bg-error-100 dark:bg-error-900/30 flex items-center justify-center"><IndianRupee size={16} className="text-error-600" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white">{f.reason}</p><p className="text-xs text-gray-500">{formatDateTime(f.created_at)}</p></div>
                    <span className="font-semibold text-error-600">{formatCurrency(f.amount)}</span>
                    <span className={`badge ${f.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{f.status}</span>
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="flex items-start gap-2.5"><Icon size={14} className="text-gray-400 mt-0.5 shrink-0" /><div className="min-w-0"><p className="text-[11px] text-gray-500 dark:text-slate-400">{label}</p><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value}</p></div></div>
}
