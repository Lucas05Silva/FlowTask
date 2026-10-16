-- FlowTask — Sonhos editáveis (Organização → Futuro)
-- Same conventions as 0011: text ids from the app's uid(), text timestamps,
-- double precision money, and PER-USER RLS (each person sees only their own).
-- linked_goal_id points at goals.id (text) — no FK, matching the rest of the
-- app (goals can be deleted from Metas; the card then falls back to its own values).

create table if not exists public.dreams (
  id              text primary key,
  user_id         text not null,
  name            text not null,
  emoji           text not null default '⭐',
  target_amount   double precision not null default 0,
  current_amount  double precision not null default 0,
  linked_goal_id  text,
  color           text not null default 'roxo',   -- roxo | cyan | verde | dourado
  notes           text,
  display_order   integer not null default 0,
  created_at      text
);

-- In case an earlier version of the table exists without some columns.
alter table public.dreams add column if not exists emoji text not null default '⭐';
alter table public.dreams add column if not exists linked_goal_id text;
alter table public.dreams add column if not exists color text not null default 'roxo';
alter table public.dreams add column if not exists notes text;
alter table public.dreams add column if not exists display_order integer not null default 0;

create index if not exists idx_dreams_user on public.dreams(user_id);

alter table public.dreams enable row level security;
drop policy if exists "own_rows" on public.dreams;
create policy "own_rows" on public.dreams for all to authenticated
  using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);

do $$
begin
  alter publication supabase_realtime add table public.dreams;
exception when others then null; -- already in publication
end $$;
