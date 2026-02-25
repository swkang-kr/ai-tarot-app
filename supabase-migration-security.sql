-- Security fixes migration
-- Run this in Supabase SQL Editor

-- C2: Atomic view_count increment function (prevents race condition)
CREATE OR REPLACE FUNCTION increment_view_count(reading_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE readings
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = reading_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO authenticated;

-- C1: RLS policy — ensure users can only read their own readings
-- (These should already exist, but add if missing)
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'readings' AND policyname = 'Users can read own readings'
  ) THEN
    CREATE POLICY "Users can read own readings"
      ON readings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'readings' AND policyname = 'Users can insert own readings'
  ) THEN
    CREATE POLICY "Users can insert own readings"
      ON readings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
