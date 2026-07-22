import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette, Globe, Save } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleTheme } from '@/store/uiSlice'
import { useSaveAnnouncement, useDeleteAnnouncement, useAnnouncements } from '@/lib/queries'
import { formatDateTime } from '@/lib/format'
import { Plus, Trash2 } from 'lucide-react'
import type { Announcement } from '@/types'

const TABS = ['General', 'Appearance', 'Notifications', 'Announcements', 'Security'] as const
type Tab = typeof TABS[number]

export default function Settings() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((s) => s.ui.theme)
  const [tab, setTab] = useState<Tab>('General')
  const { data: announcements } = useAnnouncements()
  const saveAnn = useSaveAnnouncement()
  const deleteAnn = useDeleteAnnouncement()
  const [annForm, setAnnForm] = useState<Partial<Announcement>>({ title: '', body: '', priority: 'normal', audience: 'all' })

  const handleAnnSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveAnn.mutateAsync(annForm as any)
    setAnnForm({ title: '', body: '', priority: 'normal', audience: 'all' })
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      <PageHeader title="Settings" description="Configure system preferences and announcements" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <div className="card p-2">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${tab === t ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}>
                {t === 'General' && <SettingsIcon size={16} />}
                {t === 'Appearance' && <Palette size={16} />}
                {t === 'Notifications' && <Bell size={16} />}
                {t === 'Announcements' && <Globe size={16} />}
                {t === 'Security' && <Shield size={16} />}
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            {tab === 'General' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-gray-900 dark:text-white">Library Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Library Name" value="Bibliotheca Smart Library" />
                  <Field label="Institution" value="Central Institute of Technology" />
                  <Field label="Contact Email" value="library@cit.edu" />
                  <Field label="Contact Phone" value="+91 98765 43210" />
                  <Field label="Address" value="123 Campus Road, Knowledge City" />
                  <Field label="Operating Hours" value="8:00 AM – 8:00 PM" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <Field label="Fine per Day (₹)" value="5" />
                  <Field label="Max Books per Member" value="3" />
                  <Field label="Loan Period (days)" value="14" />
                  <Field label="Renewal Limit" value="2" />
                </div>
                <button className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            )}

            {tab === 'Appearance' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-gray-900 dark:text-white">Theme & Display</h3>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                  <div><p className="font-medium text-gray-900 dark:text-white">Dark Mode</p><p className="text-xs text-gray-500 mt-0.5">Switch between light and dark themes</p></div>
                  <button onClick={() => dispatch(toggleTheme())} className={`relative w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} /></button>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-2">Accent Color</p>
                  <div className="flex gap-3">{['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'].map((c) => <button key={c} className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-gray-400" style={{ backgroundColor: c }} />)}</div>
                </div>
              </div>
            )}

            {tab === 'Notifications' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
                {['Email notifications for overdue books', 'SMS alerts for fine payments', 'Push notifications for new announcements', 'Daily attendance summary email', 'Weekly circulation report'].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                    <span className="text-sm text-gray-700 dark:text-slate-300">{n}</span>
                    <Toggle defaultOn={i < 3} />
                  </div>
                ))}
              </div>
            )}

            {tab === 'Announcements' && (
              <div className="space-y-5">
                <h3 className="font-semibold text-gray-900 dark:text-white">Manage Announcements</h3>
                <form onSubmit={handleAnnSave} className="grid grid-cols-1 gap-3 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                  <input className="input" placeholder="Announcement title" value={annForm.title || ''} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} required />
                  <textarea className="input" rows={2} placeholder="Content" value={annForm.body || ''} onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })} required />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="input" value={annForm.priority || 'normal'} onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}><option value="normal">Normal</option><option value="high">High Priority</option><option value="urgent">Urgent</option></select>
                    <select className="input" value={annForm.audience || 'all'} onChange={(e) => setAnnForm({ ...annForm, audience: e.target.value })}><option value="all">All Members</option><option value="students">Students Only</option><option value="staff">Staff Only</option></select>
                  </div>
                  <button type="submit" disabled={saveAnn.isPending} className="btn-primary w-fit"><Plus size={16} /> {saveAnn.isPending ? 'Posting...' : 'Post Announcement'}</button>
                </form>
                <div className="space-y-2">
                  {(announcements || []).map((a) => (
                    <div key={a.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 dark:border-slate-800">
                      <div><div className="flex items-center gap-2"><span className={`badge ${a.priority === 'urgent' ? 'badge-error' : a.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>{a.priority}</span><p className="font-medium text-sm text-gray-900 dark:text-white">{a.title}</p></div><p className="text-xs text-gray-500 mt-1">{a.body}</p><p className="text-[10px] text-gray-400 mt-1">{formatDateTime(a.published_at)}</p></div>
                      <button onClick={() => deleteAnn.mutate(a.id)} className="btn-ghost p-1.5 text-error-600"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'Security' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Security & Access</h3>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><div><p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p><p className="text-xs text-gray-500 mt-0.5">Require OTP for admin logins</p></div><Toggle defaultOn /></div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><div><p className="font-medium text-gray-900 dark:text-white">Session Timeout</p><p className="text-xs text-gray-500 mt-0.5">Auto-logout after 30 minutes inactivity</p></div><Toggle defaultOn /></div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><div><p className="font-medium text-gray-900 dark:text-white">Audit Logging</p><p className="text-xs text-gray-500 mt-0.5">Log all CRUD operations for compliance</p></div><Toggle defaultOn /></div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50"><div><p className="font-medium text-gray-900 dark:text-white">IP Whitelist</p><p className="text-xs text-gray-500 mt-0.5">Restrict admin access to specific IPs</p></div><Toggle /></div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><label className="label">{label}</label><input className="input" defaultValue={value} /></div>
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return <button onClick={() => setOn(!on)} className={`relative w-12 h-6 rounded-full transition-colors ${on ? 'bg-primary-500' : 'bg-gray-300 dark:bg-slate-700'}`}><span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-6' : ''}`} /></button>
}
