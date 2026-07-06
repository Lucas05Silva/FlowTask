-- FlowTask — Avatar storage (Fase 14)
-- Public bucket for profile photos. Filename convention: {user_id}.jpg (overwrite).

-- Create the public bucket (id + name = 'avatars').
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- avatar_url already exists on public.users; keep this idempotent guard.
alter table public.users add column if not exists avatar_url text;

-- Storage policies (bucket 'avatars'). File name starts with the owner's uid.
drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and split_part(name, '.', 1) = auth.uid()::text);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and split_part(name, '.', 1) = auth.uid()::text)
with check (bucket_id = 'avatars' and split_part(name, '.', 1) = auth.uid()::text);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and split_part(name, '.', 1) = auth.uid()::text);

-- Anyone can view (public bucket).
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read"
on storage.objects for select
using (bucket_id = 'avatars');
