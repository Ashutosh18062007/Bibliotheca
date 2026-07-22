/*
# Bibliotheca Smart Library ERP — Core Schema

1. Purpose
   Single-tenant enterprise library ERP. Stores books, members (students/teachers/staff),
   circulation (issue/return), library attendance (entry/exit), visitors, fines, and
   daily analytics snapshots for the dashboard. Demo auth is handled client-side, so the
   anon key must be able to read/write all tables — policies use TO anon, authenticated
   with USING (true) because the data is intentionally shared within the institution.

2. New Tables
   - books: catalog of physical/digital titles with stock tracking
   - members: students, teachers, staff with library cards
   - circulation: issue/return transactions linking members to books
   - attendance: library entry/exit sessions with time spent
   - visitors: guest/parent walk-in records
   - fines: monetary penalties for overdue/lost/damaged items
   - analytics_snapshots: daily roll-up for dashboard charts
   - activity_log: audit trail of system actions
   - announcements: broadcast notices

3. Indexes
   - books: isbn, title, category, status
   - members: card_number, role, class
   - circulation: member_id, book_id, status, due_date
   - attendance: member_id, entry_time
   - fines: member_id, status

4. Security
   - RLS enabled on every table.
   - Policies allow anon + authenticated full CRUD (shared institutional data, demo app).
*/

-- BOOKS
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn text,
  barcode text,
  title text NOT NULL,
  subtitle text,
  author text NOT NULL,
  publisher text,
  edition text,
  language text DEFAULT 'English',
  category text,
  subcategory text,
  shelf text,
  rack text,
  location text,
  cover_url text,
  total_copies int NOT NULL DEFAULT 1,
  available_copies int NOT NULL DEFAULT 1,
  issued_copies int NOT NULL DEFAULT 0,
  lost_copies int NOT NULL DEFAULT 0,
  damaged_copies int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  purchase_date date,
  vendor text,
  cost numeric(10,2),
  rating numeric(2,1) DEFAULT 0,
  reviews_count int DEFAULT 0,
  description text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);

-- MEMBERS (students, teachers, staff)
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text UNIQUE NOT NULL,
  card_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL,
  email text,
  mobile text,
  gender text,
  dob date,
  photo_url text,
  class_name text,
  section text,
  roll_number text,
  department text,
  designation text,
  qualification text,
  subjects text[],
  father_name text,
  mother_name text,
  guardian_name text,
  guardian_mobile text,
  address text,
  city text,
  state text,
  country text DEFAULT 'India',
  pin_code text,
  emergency_contact text,
  status text NOT NULL DEFAULT 'active',
  admission_date date,
  graduation_date date,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_card ON members(card_number);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_class ON members(class_name);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(full_name);

-- CIRCULATION (issue / return)
CREATE TABLE IF NOT EXISTS circulation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  issue_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL,
  return_date timestamptz,
  status text NOT NULL DEFAULT 'issued',
  fine_amount numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_circ_member ON circulation(member_id);
CREATE INDEX IF NOT EXISTS idx_circ_book ON circulation(book_id);
CREATE INDEX IF NOT EXISTS idx_circ_status ON circulation(status);
CREATE INDEX IF NOT EXISTS idx_circ_due ON circulation(due_date);

-- ATTENDANCE (library entry/exit)
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  card_number text,
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  duration_minutes int,
  purpose text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_att_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_att_entry ON attendance(entry_time);

-- VISITORS
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_type text NOT NULL,
  name text NOT NULL,
  mobile text,
  email text,
  purpose text,
  host_name text,
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  photo_url text,
  pass_number text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visitors_entry ON visitors(entry_time);

-- FINES
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  circulation_id uuid REFERENCES circulation(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_date timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fines_member ON fines(member_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);

-- ANALYTICS SNAPSHOTS (daily roll-up)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date UNIQUE NOT NULL,
  books_issued int DEFAULT 0,
  books_returned int DEFAULT 0,
  visitors int DEFAULT 0,
  new_members int DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  pending_payments numeric(12,2) DEFAULT 0,
  overdue_books int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_snap_date ON analytics_snapshots(snapshot_date);

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text,
  action text NOT NULL,
  entity text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_created ON activity_log(created_at);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  audience text DEFAULT 'all',
  priority text DEFAULT 'normal',
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ann_published ON announcements(published_at);

-- RLS + POLICIES (shared institutional data, demo app -> anon + authenticated)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['books','members','circulation','attendance','visitors','fines','analytics_snapshots','activity_log','announcements']) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- Helper to create the 4 CRUD policies for a table
CREATE OR REPLACE FUNCTION _bibliotheca_grant(t text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I;', t, t);
  EXECUTE format('CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon, authenticated USING (true);', t, t);
  EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I;', t, t);
  EXECUTE format('CREATE POLICY "anon_insert_%s" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', t, t);
  EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I;', t, t);
  EXECUTE format('CREATE POLICY "anon_update_%s" ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
  EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I;', t, t);
  EXECUTE format('CREATE POLICY "anon_delete_%s" ON %I FOR DELETE TO anon, authenticated USING (true);', t, t);
END $$;

SELECT _bibliotheca_grant('books');
SELECT _bibliotheca_grant('members');
SELECT _bibliotheca_grant('circulation');
SELECT _bibliotheca_grant('attendance');
SELECT _bibliotheca_grant('visitors');
SELECT _bibliotheca_grant('fines');
SELECT _bibliotheca_grant('analytics_snapshots');
SELECT _bibliotheca_grant('activity_log');
SELECT _bibliotheca_grant('announcements');

DROP FUNCTION IF EXISTS _bibliotheca_grant(text);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION _bibliotheca_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_books_updated ON books;
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION _bibliotheca_touch_updated_at();

DROP TRIGGER IF EXISTS trg_members_updated ON members;
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION _bibliotheca_touch_updated_at();
