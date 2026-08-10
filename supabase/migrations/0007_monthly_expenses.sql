-- FlowTask — Gastos mensais (Fase 15C)
-- Same conventions as 0001/0005/0006: text primary keys (ids from the app's
-- uid()), text date fields, double precision for money. RLS: shared
-- authenticated access; the tab is scoped to Lucas in the app layer.

-- ── monthly_expenses ─────────────────────────────────────────────────────────
create table if not exists public.monthly_expenses (
  id                 text primary key,
  user_id            text not null,
  name               text not null,
  category           text not null,
  amount             double precision not null default 0,
  recurrence         text not null default 'mensal',
  installments_total integer,
  installments_paid  integer not null default 0,
  due_day            integer,
  is_active          boolean not null default true,
  notes              text,
  created_at         text,
  updated_at         text
);

create index if not exists idx_monthly_expenses_user_id on public.monthly_expenses(user_id);

-- ── income_profile: control flag for the detailed expenses view ──────────────
alter table public.income_profile
  add column if not exists show_expenses_detail boolean default true;

-- ── RLS + Realtime (same policy pattern as 0001) ─────────────────────────────
do $$
declare
  t text;
  tables text[] := array['monthly_expenses'];
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
