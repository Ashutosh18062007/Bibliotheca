import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import Dashboard from '@/pages/Dashboard'
import Books from '@/pages/Books'
import BookDetail from '@/pages/BookDetail'
import Members from '@/pages/Members'
import MemberDetail from '@/pages/MemberDetail'
import Circulation from '@/pages/Circulation'
import Attendance from '@/pages/Attendance'
import Visitors from '@/pages/Visitors'
import Fines from '@/pages/Fines'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import KnowledgeCenter from '@/pages/KnowledgeCenter'
import Inventory from '@/pages/Inventory'
import Accounting from '@/pages/Accounting'

function Protected({ children }: { children: React.ReactNode }) {
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated)
  const isInitializing = useAppSelector((s) => s.auth.isInitializing)
  if (isInitializing) return <LoadingSpinner label="Loading Bibliotheca..." />
  if (!isAuth) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="books" element={<Books />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="circulation" element={<Circulation />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="fines" element={<Fines />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="knowledge" element={<KnowledgeCenter />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="accounting" element={<Accounting />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
