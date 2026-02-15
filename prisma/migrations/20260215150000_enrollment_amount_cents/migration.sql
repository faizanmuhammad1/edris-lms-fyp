-- Convert enrollment amounts stored in dollars to cents (amounts < 1000 assumed to be dollars)
-- Stripe and new enrollments use cents; this fixes legacy rows created with course.price (dollars)
-- Use dynamic SQL so the table name works whether it's "Enrollment" or "enrollment" in the DB
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND LOWER(c.relname) = 'enrollment'
  LOOP
    EXECUTE format('UPDATE %I SET amount = amount * 100 WHERE amount > 0 AND amount < 1000', r.relname);
  END LOOP;
END $$;
