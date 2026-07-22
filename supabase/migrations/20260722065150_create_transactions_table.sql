/*
# Create transactions table for Accounting module

1. New Tables
- `transactions`
  - `id` (uuid, primary key)
  - `type` (text, not null) — 'income' or 'expense'
  - `category` (text, not null) — e.g. 'Fine Collection', 'Book Purchase', 'Salary'
  - `description` (text)
  - `amount` (numeric, not null)
  - `date` (date, not null)
  - `payment_method` (text) — 'Cash', 'Card', 'Bank Transfer', 'UPI'
  - `reference` (text) — invoice or receipt number
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `transactions`.
- Allow anon + authenticated CRUD (shared institutional data, app has its own auth layer).
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'Cash',
  reference text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);
