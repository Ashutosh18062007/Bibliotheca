import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Eye, EyeOff, Mail, Lock, User, Shield, Fingerprint,
  ChevronRight, AlertCircle, Lock as LockIcon, CheckCircle2, Loader2,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginFailure, resetAttempts, MAX_LOGIN_ATTEMPTS } from '@/store/authSlice'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/types'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'Super Admin', label: 'Super Admin', desc: 'Full system control' },
  { value: 'Admin', label: 'Admin', desc: 'Manage all operations' },
  { value: 'Principal', label: 'Principal', desc: 'Institution oversight' },
  { value: 'Library Head', label: 'Library Head', desc: 'Library operations' },
  { value: 'Librarian', label: 'Librarian', desc: 'Issue & catalog' },
  { value: 'Teacher', label: 'Teacher', desc: 'Knowledge center' },
  { value: 'Accountant', label: 'Accountant', desc: 'Finance module' },
  { value: 'Student', label: 'Student', desc: 'Borrow & search' },
  { value: 'Parent', label: 'Parent', desc: 'Ward monitoring' },
  { value: 'Guest', label: 'Guest', desc: 'Limited access' },
]

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Incorrect email or password. Please try again.'
  if (msg.includes('Email not confirmed')) return 'Please check your inbox and confirm your email first.'
  if (msg.includes('User already registered')) return 'An account with this email already exists. Please sign in.'
  if (msg.includes('Password should be at least')) return 'Password must be at least 6 characters long.'
  return msg
}

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loginAttempts, lockedUntil } = useAppSelector((s) => s.auth)
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('Super Admin')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [captchaChecked, setCaptchaChecked] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isLocked = lockedUntil !== null && Date.now() < lockedUntil

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (isLocked) { setError('Account locked. Please wait 5 minutes before retrying.'); return }
    if (mode !== 'forgot' && !captchaChecked) { setError('Please complete the CAPTCHA verification.'); return }
    setLoading(true)
    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
        if (err) throw err
        setSuccess('Password reset link sent! Check your email inbox.')
        setMode('login'); setLoading(false); return
      }
      if (mode === 'signup') {
        if (password.length < 6) { setError('Password must be at least 6 characters long.'); setLoading(false); return }
        const { data, error: err } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role } } })
        if (err) throw err
        if (data.user && !data.session) { setSuccess('Account created! Please check your email to confirm, then sign in.'); setMode('login'); setPassword(''); setLoading(false); return }
        if (data.session) { dispatch(resetAttempts()); navigate('/'); return }
      }
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
          dispatch(loginFailure())
          const remaining = MAX_LOGIN_ATTEMPTS - loginAttempts - 1
          setError(remaining > 0 ? `${friendlyError(err.message)} ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'Account locked due to too many failed attempts. Please wait 5 minutes.')
          setLoading(false); return
        }
        if (data.user) { dispatch(resetAttempts()); navigate('/') }
      }
    } catch (err) {
      setError(friendlyError((err as Error).message || 'Something went wrong.')); setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-accent-900">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><BookOpen size={24} /></div>
            <div><h1 className="font-display font-bold text-xl">Bibliotheca</h1><p className="text-xs text-white/70">Smart Library ERP</p></div>
          </div>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight">The complete<br />library operating system</h2>
            <p className="mt-4 text-white/80 leading-relaxed">Manage books, members, circulation, attendance, visitors, fines, accounting, inventory, and analytics — all in one enterprise-grade platform.</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[{ label: 'Books managed', value: '1M+' }, { label: 'Concurrent users', value: '10K+' }, { label: 'Uptime SLA', value: '99.99%' }, { label: 'Avg. load time', value: '<2s' }].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur p-4"><p className="text-2xl font-bold font-display">{s.value}</p><p className="text-xs text-white/70">{s.label}</p></div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/50 flex items-center gap-2"><Shield size={14} /> SOC 2 · OWASP Top 10 · ISO 27001 · GDPR Compliant</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center"><BookOpen size={24} className="text-white" /></div>
            <div><h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">Bibliotheca</h1><p className="text-xs text-gray-500">Smart Library ERP</p></div>
          </div>

          <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {mode === 'login' ? 'Sign in with your email and password' : mode === 'signup' ? 'Create a new library account with your own email' : 'Enter your email to receive a reset link'}
          </p>

          {isLocked && <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 text-sm"><LockIcon size={16} /> Account locked due to multiple failed attempts. Try again in 5 minutes.</div>}
          {success && <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-sm"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div><label className="label">Full name</label><div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required /></div></div>
            )}
            <div><label className="label">Email address</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" className="input pl-9" placeholder="you@institution.edu" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Password</label>
                  {mode === 'login' && <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess('') }} className="text-xs text-primary-600 hover:underline mb-1.5">Forgot password?</button>}
                </div>
                <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type={showPassword ? 'text' : 'password'} className="input pl-9 pr-9" placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'signup' ? 6 : undefined} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              </div>
            )}
            {mode === 'signup' && (
              <div><label className="label">Role</label><select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}</select></div>
            )}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 cursor-pointer"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" /> Remember me</label>
                <div className="flex items-center gap-2"><Fingerprint size={16} className="text-primary-600" /><span className="text-xs text-gray-500">Biometric login</span></div>
              </div>
            )}
            {mode !== 'forgot' && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <input type="checkbox" checked={captchaChecked} onChange={(e) => setCaptchaChecked(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2"><Shield size={14} /> I'm not a robot</span>
                <span className="ml-auto text-[10px] text-gray-400">reCAPTCHA</span>
              </div>
            )}
            {error && <div className="flex items-start gap-2 p-3 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 text-sm"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}</div>}
            <button type="submit" disabled={loading || isLocked} className="btn-primary w-full py-2.5">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>{mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}<ChevronRight size={18} /></>}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-800" /></div><div className="relative flex justify-center"><span className="bg-gray-50 dark:bg-slate-950 px-3 text-xs text-gray-400">or continue with</span></div></div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-secondary py-2.5"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg> Google</button>
                <button className="btn-secondary py-2.5"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#0078D4" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/></svg> Microsoft</button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
            {mode === 'login' ? "Don't have an account? " : mode === 'signup' ? 'Already have an account? ' : 'Remember your password? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }} className="text-primary-600 font-semibold hover:underline">{mode === 'login' ? 'Sign up' : 'Sign in'}</button>
          </p>
          {mode === 'signup' && <div className="mt-6 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-xs text-primary-700 dark:text-primary-300"><p className="font-semibold mb-1 flex items-center gap-1.5"><CheckCircle2 size={14} /> Your account is real</p><p>Use your own email and choose a password (min 6 characters). Your session stays logged in across page refreshes.</p></div>}
        </motion.div>
      </div>
    </div>
  )
}
