import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, TABLES } from '@/lib/supabase'
import type { Book, Member, Circulation, Attendance, Visitor, Fine, AnalyticsSnapshot, ActivityLog, Announcement } from '@/types'

// ===== BOOKS =====
export function useBooks() {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.books).select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Book[]
    },
  })
}
export function useSaveBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (book: Partial<Book> & { id?: string }) => {
      if (book.id) {
        const { id, ...rest } = book
        const { data, error } = await supabase.from(TABLES.books).update(rest).eq('id', id).select().single()
        if (error) throw error; return data
      }
      const { data, error } = await supabase.from(TABLES.books).insert({ ...book, available_copies: book.total_copies || 1 }).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }) },
  })
}
export function useDeleteBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.books).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['books'] }) },
  })
}

// ===== MEMBERS =====
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.members).select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Member[]
    },
  })
}
export function useSaveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (member: Partial<Member> & { id?: string }) => {
      if (member.id) {
        const { id, ...rest } = member
        const { data, error } = await supabase.from(TABLES.members).update(rest).eq('id', id).select().single()
        if (error) throw error; return data
      }
      const { data, error } = await supabase.from(TABLES.members).insert(member).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }) },
  })
}
export function useDeleteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.members).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }) },
  })
}

// ===== CIRCULATION =====
export function useCirculation() {
  return useQuery({
    queryKey: ['circulation'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.circulation).select('*, book:books(*), member:members(*)').order('created_at', { ascending: false })
      if (error) throw error
      return data as Circulation[]
    },
  })
}
export function useIssueBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ book_id, member_id, due_days }: { book_id: string; member_id: string; due_days: number }) => {
      const issueDate = new Date()
      const dueDate = new Date(issueDate.getTime() + due_days * 86400000)
      const { data, error } = await supabase.from(TABLES.circulation).insert({
        book_id, member_id, issue_date: issueDate.toISOString(), due_date: dueDate.toISOString(),
        status: 'issued', fine_amount: 0,
      }).select().single()
      if (error) throw error
      // Decrement available_copies
      const { data: book } = await supabase.from(TABLES.books).select('available_copies, issued_copies, total_copies').eq('id', book_id).single()
      if (book) {
        const newAvail = Math.max(book.available_copies - 1, 0)
        const newIssued = Math.min(book.issued_copies + 1, book.total_copies)
        const newStatus = newAvail === 0 ? 'issued' : 'available'
        await supabase.from(TABLES.books).update({ available_copies: newAvail, issued_copies: newIssued, status: newStatus }).eq('id', book_id)
      }
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['circulation'] }); qc.invalidateQueries({ queryKey: ['books'] }) },
  })
}
export function useReturnBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ circulation_id, book_id }: { circulation_id: string; book_id: string }) => {
      const { data, error } = await supabase.from(TABLES.circulation).update({
        return_date: new Date().toISOString(), status: 'returned',
      }).eq('id', circulation_id).select().single()
      if (error) throw error
      // Increment available_copies
      const { data: book } = await supabase.from(TABLES.books).select('available_copies, issued_copies, total_copies').eq('id', book_id).single()
      if (book) {
        const newAvail = Math.min(book.available_copies + 1, book.total_copies)
        const newIssued = Math.max(book.issued_copies - 1, 0)
        await supabase.from(TABLES.books).update({ available_copies: newAvail, issued_copies: newIssued, status: 'available' }).eq('id', book_id)
      }
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['circulation'] }); qc.invalidateQueries({ queryKey: ['books'] }) },
  })
}

// ===== ATTENDANCE =====
export function useAttendance() {
  return useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.attendance).select('*, member:members(*)').order('entry_time', { ascending: false }).limit(500)
      if (error) throw error
      return data as Attendance[]
    },
  })
}
export function useSaveAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (att: Partial<Attendance> & { id?: string }) => {
      if (att.id) {
        const { id, ...rest } = att
        const { data, error } = await supabase.from(TABLES.attendance).update(rest).eq('id', id).select().single()
        if (error) throw error; return data
      }
      const { data, error } = await supabase.from(TABLES.attendance).insert(att).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }) },
  })
}
export function useDeleteAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.attendance).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }) },
  })
}

// ===== VISITORS =====
export function useVisitors() {
  return useQuery({
    queryKey: ['visitors'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.visitors).select('*').order('entry_time', { ascending: false })
      if (error) throw error
      return data as Visitor[]
    },
  })
}
export function useSaveVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: Partial<Visitor> & { id?: string }) => {
      if (v.id) {
        const { id, ...rest } = v
        const { data, error } = await supabase.from(TABLES.visitors).update(rest).eq('id', id).select().single()
        if (error) throw error; return data
      }
      const { data, error } = await supabase.from(TABLES.visitors).insert(v).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }) },
  })
}
export function useDeleteVisitor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.visitors).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visitors'] }) },
  })
}

// ===== FINES =====
export function useFines() {
  return useQuery({
    queryKey: ['fines'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.fines).select('*, member:members(*)').order('created_at', { ascending: false })
      if (error) throw error
      return data as Fine[]
    },
  })
}
export function useSaveFine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (f: Partial<Fine> & { id?: string }) => {
      if (f.id) {
        const { id, ...rest } = f
        if (rest.status === 'paid' && !rest.paid_date) rest.paid_date = new Date().toISOString()
        const { data, error } = await supabase.from(TABLES.fines).update(rest).eq('id', id).select().single()
        if (error) throw error; return data
      }
      const { data, error } = await supabase.from(TABLES.fines).insert(f).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fines'] }) },
  })
}
export function useDeleteFine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.fines).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fines'] }) },
  })
}

// ===== ANALYTICS =====
export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.analytics).select('*').order('snapshot_date', { ascending: true })
      if (error) throw error
      return data as AnalyticsSnapshot[]
    },
  })
}

// ===== ACTIVITY LOG =====
export function useActivityLog() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.activityLog).select('*').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      return data as ActivityLog[]
    },
  })
}

// ===== ANNOUNCEMENTS =====
export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase.from(TABLES.announcements).select('*').order('published_at', { ascending: false })
      if (error) throw error
      return data as Announcement[]
    },
  })
}
export function useSaveAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a: Partial<Announcement> & { id?: string }) => {
      if (a.id) {
        const { id, ...rest } = a
        const { data, error } = await supabase.from(TABLES.announcements).update(rest).eq('id', id).select().single()
        if (error) throw error; return data
      }
      const { data, error } = await supabase.from(TABLES.announcements).insert(a).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }) },
  })
}
export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLES.announcements).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }) },
  })
}
