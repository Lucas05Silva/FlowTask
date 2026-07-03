-- FlowTask — Normalized schema (Fase 12)
-- One table per module. Date/datetime fields are text (the app owns date logic;
-- avoids timezone reinterpretation). Nested collections (subtasks, steps, tags,
-- checklist, prompt variables/history) are jsonb columns on the parent row.
-- RLS: any authenticated user (Lucas/Thaiane) has full access (shared data).

-- ── users (profile mirror of auth.users) ────────────────────────────────────
create table if not exists public.users (
  id                uuid primary key,
  email             text,
  name              text,
  avatar_url        text,
  avatar_emoji      text,
  xp                integer default 0,
  level             integer default 1,
  streak_count      integer default 0,
  streak_record     integer default 0,
  streak_last_date  text,
  theme_preference  text default 'system',
  created_at        text
);

-- ── tasks ────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id              text primary key,
  title           text,
  description     text,
  due_date        text,
  priority        text,
  category        text,
  status          text,
  assignee        text,
  subtasks        jsonb default '[]'::jsonb,
  is_recurring    boolean default false,
  recurrence_rule text,
  parent_task_id  text,
  goal_id         text,
  xp_reward       integer default 0,
  "order"         integer default 0,
  created_by      text,
  created_at      text,
  completed_at    text
);

-- ── calendar_events ──────────────────────────────────────────────────────────
create table if not exists public.calendar_events (
  id             text primary key,
  title          text,
  start_datetime text,
  end_datetime   text,
  category       text,
  location       text,
  notes          text,
  is_all_day     boolean default false,
  created_by     text,
  created_at     text
);

-- ── projects ─────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id           text primary key,
  client_name  text,
  project_name text,
  service_type text,
  status       text,
  start_date   text,
  deadline     text,
  value        double precision default 0,
  assignee     text,
  steps        jsonb default '[]'::jsonb,
  notes        text,
  created_at   text,
  completed_at text
);

-- ── finances_entries ─────────────────────────────────────────────────────────
create table if not exists public.finances_entries (
  id              text primary key,
  type            text,
  amount          double precision default 0,
  description     text,
  date            text,
  category        text,
  tags            jsonb default '[]'::jsonb,
  is_recurring    boolean default false,
  recurrence_rule text,
  created_by      text,
  created_at      text
);

-- ── debts ────────────────────────────────────────────────────────────────────
create table if not exists public.debts (
  id                 text primary key,
  name               text,
  total_amount       double precision default 0,
  paid_amount        double precision default 0,
  installments_total integer default 0,
  installments_paid  integer default 0,
  due_day            integer,
  interest_rate      double precision,
  status             text,
  notes              text,
  created_by         text,
  created_at         text,
  paid_at            text
);

-- ── goals ────────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id             text primary key,
  title          text,
  description    text,
  type           text,
  target_amount  double precision default 0,
  current_amount double precision default 0,
  unit           text,
  checklist      jsonb,
  deadline       text,
  category       text,
  linked_module  text,
  linked_id      text,
  xp_reward      integer default 0,
  status         text,
  created_by     text,
  created_at     text,
  completed_at   text
);

-- ── apartment_items ──────────────────────────────────────────────────────────
create table if not exists public.apartment_items (
  id                text primary key,
  room              text,
  name              text,
  estimated_cost    double precision default 0,
  actual_cost       double precision,
  priority          text,
  status            text,
  purchase_deadline text,
  store_link        text,
  notes             text,
  created_by        text,
  created_at        text
);

-- ── wedding_tasks ────────────────────────────────────────────────────────────
create table if not exists public.wedding_tasks (
  id           text primary key,
  title        text,
  description  text,
  deadline     text,
  assignee     text,
  status       text,
  category     text,
  created_at   text,
  completed_at text
);

-- ── wedding_budget ───────────────────────────────────────────────────────────
create table if not exists public.wedding_budget (
  id             text primary key,
  category       text,
  estimated_cost double precision default 0,
  actual_cost    double precision default 0,
  notes          text
);

-- ── wedding_vendors ──────────────────────────────────────────────────────────
create table if not exists public.wedding_vendors (
  id            text primary key,
  name          text,
  service       text,
  contact_phone text,
  contact_email text,
  quoted_value  double precision default 0,
  status        text,
  notes         text
);

-- ── user_achievements ────────────────────────────────────────────────────────
create table if not exists public.user_achievements (
  id             text primary key,
  user_id        text,
  achievement_id text,
  unlocked_at    text
);

-- ── notifications ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         text primary key,
  user_id    text,
  type       text,
  title      text,
  message    text,
  is_read    boolean default false,
  link       text,
  icon       text,
  created_at text
);

-- ── task_prompts ─────────────────────────────────────────────────────────────
create table if not exists public.task_prompts (
  id            text primary key,
  task_id       text,
  title         text,
  description   text,
  category      text,
  content       text,
  variables     jsonb default '[]'::jsonb,
  usage_history jsonb default '[]'::jsonb,
  created_by    text,
  created_at    text,
  updated_at    text,
  updated_by    text
);

-- ── wedding_config (singleton) ───────────────────────────────────────────────
create table if not exists public.wedding_config (
  id                    text primary key,
  wedding_date          text,
  wedding_venue_name    text,
  wedding_venue_address text
);

-- ── RLS + Realtime for every table ───────────────────────────────────────────
do $$
declare
  t text;
  tables text[] := array[
    'users','tasks','calendar_events','projects','finances_entries','debts','goals',
    'apartment_items','wedding_tasks','wedding_budget','wedding_vendors',
    'user_achievements','notifications','task_prompts','wedding_config'
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

-- ── Auto-create profile row when an auth user is created ──────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, xp, level, streak_count, streak_record, theme_preference, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    0, 1, 0, 0, 'system', now()::text
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Ensure the two existing users have profile rows (clean, zeroed) ───────────
insert into public.users (id, email, name, avatar_emoji, xp, level, streak_count, streak_record, theme_preference, created_at)
values
  ('a5f1faa0-587c-4545-8b70-d7820a5075cc', 'lukasoliveira47210@gmail.com', 'Lucas',   '🦁', 0, 1, 0, 0, 'system', now()::text),
  ('6c813876-52e7-48b6-bfb9-91c70439c9d8', 'thaiifranca10@gmail.com',      'Thaiane', '🦋', 0, 1, 0, 0, 'system', now()::text)
on conflict (id) do nothing;
