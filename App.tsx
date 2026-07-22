import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setSession } from '@/store/authSlice'
import AppRoutes from '@/routes'
import { supabase } from '@/lib/supabase'

export default function App() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((s) => s.ui.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) dispatch(setSession({ id: data.session.user.id, email: data.session.user.email || '' }))
      else dispatch(setSession(null))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) dispatch(setSession({ id: session.user.id, email: session.user.email || '' }))
        else dispatch(setSession(null))
      })()
    })
    return () => { sub.subscription.unsubscribe() }
  }, [dispatch])

  return <AppRoutes />
}
