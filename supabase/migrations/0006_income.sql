-- FlowTask — Minha Renda (Fase 15B)
-- Same conventions as 0001/0005: text primary keys (ids from the app's uid()),
-- text date fields, double precision for money, jsonb for nested collections.
-- RLS: shared authenticated access; the tab is scoped to Lucas in the app layer.

-- ── income_profile (one row per user — id = user_id) ─────────────────────────
create table if not exists public.income_profile (
  id                     text primary key,
  user_id                text not null,
  sources                jsonb not null default '[]'::jsonb,
  monthly_expenses       double precision not null default 1200,
  investment_goal_pct    double precision not null default 20,
  flowsys_investment_pct double precision not null default 10,
  updated_at             text
);

-- ── income_history ───────────────────────────────────────────────────────────
create table if not exists public.income_history (
  id             text primary key,
  user_id        text not null,
  month          text not null,
  total_fixed    double precision not null default 0,
  total_variable double precision not null default 0,
  note           text,
  created_at     text
);

create index if not exists idx_income_profile_user_id on public.income_profile(user_id);
create index if not exists idx_income_history_user_id on public.income_history(user_id);

-- ── RLS + Realtime (same policy pattern as 0001) ─────────────────────────────
do $$
declare
  t text;
  tables text[] := array['income_profile', 'income_history'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "auth_full_access" on public.%I;', t);
    execute format(
      'create policy "auth_full_access" on public.%I for all to authenticated using (true) with check (true);',
      t
    );
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when others then null; -- already in publication
    end;
  end loop;
end $$;
