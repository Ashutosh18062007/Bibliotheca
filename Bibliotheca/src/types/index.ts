export type Role =
  | 'Super Admin' | 'Admin' | 'Principal' | 'Library Head'
  | 'Teacher' | 'Librarian' | 'Accountant' | 'Receptionist'
  | 'Student' | 'Parent' | 'Guest'

export interface Book {
  id: string; isbn: string | null; barcode: string | null; title: string; subtitle: string | null;
  author: string; publisher: string | null; edition: string | null; language: string;
  category: string | null; subcategory: string | null; shelf: string | null; rack: string | null;
  location: string | null; cover_url: string | null; total_copies: number; available_copies: number;
  issued_copies: number; lost_copies: number; damaged_copies: number; status: string;
  purchase_date: string | null; vendor: string | null; cost: number | null; rating: number;
  reviews_count: number; description: string | null; tags: string[] | null;
  created_at: string; updated_at: string;
}

export interface Member {
  id: string; member_id: string; card_number: string; full_name: string; role: string;
  email: string | null; mobile: string | null; gender: string | null; dob: string | null;
  photo_url: string | null; class_name: string | null; section: string | null;
  roll_number: string | null; department: string | null; designation: string | null;
  qualification: string | null; subjects: string[] | null; father_name: string | null;
  mother_name: string | null; guardian_name: string | null; guardian_mobile: string | null;
  address: string | null; city: string | null; state: string | null; country: string;
  pin_code: string | null; emergency_contact: string | null; status: string;
  admission_date: string | null; graduation_date: string | null; remarks: string | null;
  created_at: string; updated_at: string;
}

export interface Circulation {
  id: string; member_id: string; book_id: string; issue_date: string; due_date: string;
  return_date: string | null; status: string; fine_amount: number; notes: string | null;
  created_at: string; book?: Book; member?: Member;
}

export interface Attendance {
  id: string; member_id: string | null; card_number: string | null; entry_time: string;
  exit_time: string | null; duration_minutes: number | null; purpose: string | null;
  created_at: string; member?: Member;
}

export interface Visitor {
  id: string; visitor_type: string; name: string; mobile: string | null; email: string | null;
  purpose: string | null; host_name: string | null; entry_time: string; exit_time: string | null;
  photo_url: string | null; pass_number: string | null; created_at: string;
}

export interface Fine {
  id: string; member_id: string; circulation_id: string | null; amount: number;
  reason: string; status: string; paid_date: string | null; created_at: string; member?: Member;
}

export interface AnalyticsSnapshot {
  id: string; snapshot_date: string; books_issued: number; books_returned: number;
  visitors: number; new_members: number; revenue: number; pending_payments: number; overdue_books: number;
}

export interface ActivityLog {
  id: string; actor: string | null; action: string; entity: string | null;
  entity_id: string | null; details: Record<string, unknown> | null;
  ip_address: string | null; created_at: string;
}

export interface Announcement {
  id: string; title: string; body: string | null; audience: string; priority: string;
  published_at: string; expires_at: string | null; created_at: string;
}
