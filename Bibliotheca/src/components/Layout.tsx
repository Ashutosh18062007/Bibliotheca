import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, Clock, UserCheck,
  IndianRupee, FileBarChart, Settings, GraduationCap, Package, Calculator,
  LogOut, Menu, Bell, Search, Sun, Moon, ChevronLeft, ShieldCheck,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { toggleTheme, toggleSidebar, toggleMobileSidebar, closeMobileSidebar, markAllRead } from '@/store/uiSlice'
import { logout } from '@/store/authSlice'
import { supabase } from '@/lib/supabase'
import { initials, avatarColor } from '@/lib/format'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/books', label: 'Books', icon: BookOpen },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/circulation', label: 'Circulation', icon: ArrowLeftRight },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/visitors', label: 'Visitors', icon: UserCheck },
  { to: '/fines', label: 'Fines', icon: IndianRupee },
  { to: '/knowledge', label: 'Knowledge Center', icon: GraduationCap },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/accounting', label: 'Accounting', icon: Calculator },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { sidebar, mobileSidebarOpen, theme, notifications } = useAppSelector((s) => s.ui)
  const user = useAppSelector((s) => s.auth.user)
  const collapsed = sidebar === 'collapsed'
  const unread = notifications.filter((n) => !n.read).length

  const handleLogout = async () => {
    await supabase.auth.signOut()
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950">
      <aside className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent collapsed={collapsed} />
      </aside>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => dispatch(closeMobileSidebar())} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25 }} className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-50 flex flex-col">
              <SidebarContent collapsed={false} onNavigate={() => dispatch(closeMobileSidebar())} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => dispatch(toggleMobileSidebar())} className="lg:hidden btn-ghost p-2"><Menu size={20} /></button>
            <button onClick={() => dispatch(toggleSidebar())} className="hidden lg:flex btn-ghost p-2"><ChevronLeft size={20} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} /></button>
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search books, members, ISBN..." className="input pl-9 w-72" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => dispatch(toggleTheme())} className="btn-ghost p-2" aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="relative group">
              <button className="btn-ghost p-2 relative">
                <Bell size={20} />
                {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
              </button>
              <div className="absolute right-0 mt-2 w-80 card shadow-xl z-50 hidden group-hover:block">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-800">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button onClick={() => dispatch(markAllRead())} className="text-xs text-primary-600 hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-3 border-b border-gray-100 dark:border-slate-800 ${n.read ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'warning' ? 'bg-warning-500' : n.type === 'success' ? 'bg-success-500' : 'bg-primary-500'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-200 dark:border-slate-800">
              <div className={`w-9 h-9 rounded-full ${avatarColor(user?.name || 'U')} flex items-center justify-center text-white text-sm font-semibold`}>{initials(user?.name || 'User')}</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="btn-ghost p-2" aria-label="Logout"><LogOut size={18} /></button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin"><Outlet /></main>
      </div>
    </div>
  )
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <>
      <div className={`h-16 flex items-center gap-2 px-4 border-b border-gray-200 dark:border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shrink-0"><BookOpen size={20} className="text-white" /></div>
        {!collapsed && <div><h1 className="font-display font-bold text-lg leading-none">Bibliotheca</h1><p className="text-[10px] text-gray-500 dark:text-slate-400">Smart Library ERP</p></div>}
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 mb-0.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'} ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : undefined}>
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className={`p-3 border-t border-gray-200 dark:border-slate-800 ${collapsed ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50 dark:bg-success-900/20">
          <ShieldCheck size={16} className="text-success-600" />
          <div className="text-xs"><p className="font-semibold text-success-700 dark:text-success-400">System Secure</p><p className="text-success-600/70 dark:text-success-500/70">All services operational</p></div>
        </div>
      </div>
    </>
  )
}
