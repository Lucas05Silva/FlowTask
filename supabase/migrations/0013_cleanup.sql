-- ============================================================================
-- FlowTask — 0013: Limpeza geral (Novembro 2026)
--   1) apaga as tarefas concluídas (subtarefas são jsonb dentro de tasks)
--   2) remove o módulo Casamento
--   3) remove a gamificação (XP, níveis, streak, conquistas)
--
-- Rode SÓ DEPOIS do deploy do código que já não usa essas colunas/tabelas.
-- DROP é irreversível — baixe um backup antes (Database → Backups).
--
-- Conferência prévia (opcional):
--   select status, count(*) from public.tasks group by status;
-- ============================================================================

-- 1) Tarefas concluídas. DELETE (e não TRUNCATE) para disparar eventos Realtime:
--    abas abertas também removem as tarefas da memória.
delete from public.tasks where status = 'concluida';

-- 2) Casamento
drop table if exists
  public.wedding_tasks,
  public.wedding_budget,
  public.wedding_vendors,
  public.wedding_config
  cascade;

-- 3) Gamificação
drop table if exists public.user_achievements cascade;

alter table public.users
  drop column if exists xp,
  drop column if exists level,
  drop column if exists streak_count,
  drop column if exists streak_record,
  drop column if exists streak_last_date;

alter table public.tasks drop column if exists xp_reward;
alter table public.goals drop column if exists xp_reward;
