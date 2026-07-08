-- FlowTask — Goal contributions bidirectional links (Fase 15)

-- Add columns to tasks if they don't exist
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS goal_contribution_type TEXT DEFAULT 'count',
  ADD COLUMN IF NOT EXISTS goal_contribution_value DOUBLE PRECISION DEFAULT 1;

-- Add columns to goals if they don't exist
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS contribution_type TEXT DEFAULT 'count',
  ADD COLUMN IF NOT EXISTS contribution_value_per_task DOUBLE PRECISION DEFAULT 1;

-- Index for searching tasks by goal_id for performance
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);
