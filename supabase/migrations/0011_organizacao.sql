-- FlowTask — Aba Organização (cockpit financeiro pessoal)
-- Same conventions as 0001/0005/0009: text primary keys (ids from the app's
-- uid()), text timestamps, double precision for money.
-- DIFFERENT from the rest of the app: RLS is per-user (user_id = auth.uid()),
-- so each person only ever reads/writes their own plans, items and ideas —
-- the store's hydrate (select *) naturally returns only the logged-in user's rows.

-- ── monthly_plans ────────────────────────────────────────────────────────────
create table if not exists public.monthly_plans (
  id              text primary key,          -- mp_<userId>_<yyyy-mm> (deterministic)
  user_id         text not null,
  month           integer not null,
  year            integer not null,
  total_income    double precision not null default 0,
  notes           text not null default '',
  patrimony_total double precision,
  created_at      text,
  updated_at      text,
  unique (user_id, month, year)
);

-- ── monthly_plan_items ───────────────────────────────────────────────────────
create table if not exists public.monthly_plan_items (
  id              text primary key,
  plan_id         text not null references public.monthly_plans(id) on delete cascade,
  user_id         text not null,
  category        text not null,             -- fixa | variavel | investimento | meta | divida | reserva
  name            text not null,
  planned_amount  double precision not null default 0,
  actual_amount   double precision not null default 0,
  linked_type     text,                      -- debt | financial_goal | investment
  linked_id       text,
  is_paid         boolean not null default false,
  paid_at         text,
  paid_record_id  text,                      -- finances_entries.id created when paid
  notes           text,
  created_at      text
);

-- ── financial_ideas ──────────────────────────────────────────────────────────
create table if not exists public.financial_ideas (
  id           text primary key,
  user_id      text not null,
  plan_id      text not null references public.monthly_plans(id) on delete cascade,
  content      text not null,
  promoted_to  text,                         -- goal | task | note
  promoted_id  text,
  created_at   text
);

create index if not exists idx_monthly_plans_user on public.monthly_plans(user_id);
create index if not exists idx_monthly_plan_items_plan on public.monthly_plan_items(plan_id);
create index if not exists idx_financial_ideas_plan on public.financial_ideas(plan_id);

-- ── RLS: each user sees ONLY their own rows + Realtime ───────────────────────
do $$
declare
  t text;
  tables text[] := array['monthly_plans', 'monthly_plan_items', 'financial_ideas'];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "own_rows" on public.%I;', t);
    execute format(
      'create policy "own_rows" on public.%I for all to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);',
      t
    );
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when others then null; -- already in publication
    end;
  end loop;
end $$;
