/*
# Add unique constraints on books.barcode and books.isbn for idempotent seeding
1. Modified Tables
   - books: UNIQUE on barcode (used by seed ON CONFLICT). isbn also made unique.
*/
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_barcode_unique;
ALTER TABLE books ADD CONSTRAINT books_barcode_unique UNIQUE (barcode);
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_isbn_unique;
ALTER TABLE books ADD CONSTRAINT books_isbn_unique UNIQUE (isbn);
