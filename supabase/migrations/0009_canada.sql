-- FlowTask — Seção Canadá (Fase 16)
-- Same conventions as 0001/0005/0007: text primary keys (ids from the app's
-- uid()), text date fields, double precision for money. RLS: shared
-- authenticated access (Lucas and Thaiane see/manage everything).
-- Seeding (decisions/documents/cities/checklist) is done client-side in
-- hooks/useCanada.ts, mirroring the investments module's seedIfEmpty().

-- ── canada_decisions ─────────────────────────────────────────────────────────
create table if not exists public.canada_decisions (
  id          text primary key,
  category    text not null,
  question    text not null,
  answer      text,
  status      text not null default 'pendente',
  notes       text,
  decided_at  text,
  created_at  text
);

-- ── canada_documents ─────────────────────────────────────────────────────────
create table if not exists public.canada_documents (
  id           text primary key,
  name         text not null,
  owner        text not null,
  category     text not null,
  status       text not null default 'pendente',
  expiry_date  text,
  deadline     text,
  notes        text,
  completed_at text,
  created_at   text
);

-- ── canada_checklist ─────────────────────────────────────────────────────────
create table if not exists public.canada_checklist (
  id           text primary key,
  category     text not null,
  title        text not null,
  description  text,
  assigned_to  text not null default 'ambos',
  status       text not null default 'pendente',
  priority     text not null default 'media',
  due_date     text,
  completed_at text,
  created_at   text
);

-- ── canada_cities ────────────────────────────────────────────────────────────
create table if not exists public.canada_cities (
  id           text primary key,
  name         text not null,
  province     text not null,
  pros         text[] not null default '{}',
  cons         text[] not null default '{}',
  avg_rent1br  double precision,
  notes        text,
  is_favorite  boolean not null default false,
  is_chosen    boolean not null default false,
  created_at   text
);

-- ── canada_notes ─────────────────────────────────────────────────────────────
create table if not exists public.canada_notes (
  id         text primary key,
  title      text not null,
  content    text,
  category   text not null default 'geral',
  created_by text,
  created_at text
);

create index if not exists idx_canada_documents_owner on public.canada_documents(owner);
create index if not exists idx_canada_checklist_category on public.canada_checklist(category);

-- ── RLS + Realtime (same policy pattern as 0001/0007) ────────────────────────
do $$
declare
  t text;
  tables text[] := array[
    'canada_decisions', 'canada_documents', 'canada_checklist', 'canada_cities', 'canada_notes'
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
