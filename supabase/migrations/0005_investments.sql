-- FlowTask — Investimentos (Fase 15)
-- Same conventions as 0001: text primary keys (ids come from the app's uid()),
-- text date fields (the app owns date logic), double precision for money.
-- RLS: shared authenticated access (data is scoped per-user in the app layer,
-- consistent with the rest of the sync store).

-- ── investments ──────────────────────────────────────────────────────────────
create table if not exists public.investments (
  id                text primary key,
  user_id           text not null,
  name              text not null,
  type              text not null,
  index             text not null default 'selic',
  rate              double precision not null default 0,
  invested_amount   double precision not null default 0,
  current_value     double precision not null default 0,
  purchase_date     text not null,
  maturity_date     text,
  liquidity         text not null default 'diaria',
  liquidity_days    integer,
  is_emergency_fund boolean not null default false,
  goal_id           text,
  notes             text,
  created_at        text,
  updated_at        text
);

-- ── investment_contributions ─────────────────────────────────────────────────
create table if not exists public.investment_contributions (
  id            text primary key,
  investment_id text not null,
  user_id       text not null,
  amount        double precision not null default 0,
  date          text not null,
  notes         text,
  created_at    text
);

-- ── patrimony_snapshots ──────────────────────────────────────────────────────
create table if not exists public.patrimony_snapshots (
  id             text primary key,
  user_id        text not null,
  month          text not null,
  total_invested double precision not null default 0,
  total_current  double precision not null default 0,
  snapshot_at    text,
  unique (user_id, month)
);

create index if not exists idx_investments_user_id on public.investments(user_id);
create index if not exists idx_investment_contributions_investment_id on public.investment_contributions(investment_id);
create index if not exists idx_patrimony_snapshots_user_id on public.patrimony_snapshots(user_id);

-- ── RLS + Realtime (same policy pattern as 0001) ─────────────────────────────
do $$
declare
  t text;
  tables text[] := array[
    'investments','investment_contributions','patrimony_snapshots'
  ];
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
