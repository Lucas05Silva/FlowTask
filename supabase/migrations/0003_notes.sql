-- FlowTask — Notes module (Fase 13)
-- Notes table, security policies (RLS), and Realtime subscription.

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT 'default',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Select policy: Owner can read, anyone can read if is_shared is TRUE
DROP POLICY IF EXISTS "Users can read own and shared notes" ON public.notes;
CREATE POLICY "Users can read own and shared notes"
ON public.notes FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id 
  OR is_shared = TRUE
);

-- Insert policy: Only owner can insert their own notes
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
CREATE POLICY "Users can insert own notes"
ON public.notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Update policy: Only owner can update their own notes
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes"
ON public.notes FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- Delete policy: Only owner can delete their own notes
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes"
ON public.notes FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
EXCEPTION WHEN OTHERS THEN
  -- Table already in publication, ignore
  NULL;
END $$;
