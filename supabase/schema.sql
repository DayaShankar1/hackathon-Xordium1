-- CampusSphere starter schema for Supabase
-- Review policies and test with separate student/admin accounts before production.
-- Run this in the Supabase SQL Editor.
-- Then apply supabase/migrations/202611010002_lost_found_foundation.sql.
-- Then apply supabase/migrations/202611010003_resource_hub_foundation.sql.
-- Then apply supabase/migrations/202611010004_campus_fix_foundation.sql.
-- Then apply supabase/migrations/202611010005_campus_fix_timeline_rls_fix.sql.
-- Then apply supabase/migrations/202611010006_campus_fix_authority_notification_preference.sql.

begin;

create extension if not exists pgcrypto;

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student' check (char_length(btrim(display_name)) between 1 and 60),
  avatar_url text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Helpers ----------
-- This must be created after profiles so a fresh schema can resolve the table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data->>'display_name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Student'
      ),
      60
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill profiles for Auth users created before this schema was applied.
insert into public.profiles (id, display_name)
select
  users.id,
  left(
    coalesce(
      nullif(btrim(users.raw_user_meta_data->>'display_name'), ''),
      nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
      'Student'
    ),
    60
  )
from auth.users as users
on conflict (id) do nothing;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and (select auth.uid()) is not null
    and not public.is_admin()
  then
    raise exception 'Profile roles can only be changed by a trusted administrator'
      using errcode = '42501';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.protect_profile_role() from public;

drop trigger if exists protect_profile_role_on_update on public.profiles;
create trigger protect_profile_role_on_update
before update on public.profiles
for each row execute procedure public.protect_profile_role();

-- ---------- Lost & Found ----------
create table if not exists public.lost_found_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('lost','found')),
  title text not null,
  description text not null,
  category text not null,
  location text not null,
  incident_date date,
  image_path text,
  status text not null default 'open' check (status in ('open','claimed','resolved','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Resources ----------
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  subject text not null,
  semester text,
  resource_type text not null check (resource_type in ('notes','pyq','assignment','book','other')),
  file_path text not null,
  file_name text not null,
  mime_type text,
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false
);

-- ---------- Clubs & Events ----------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  logo_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'published' check (status in ('draft','published','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------- Marketplace ----------
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  condition text not null check (condition in ('new','like_new','good','fair')),
  price numeric(10,2) not null check (price >= 0),
  image_path text,
  status text not null default 'available' check (status in ('available','sold','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- CampusFix ----------
create table if not exists public.campus_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('hostel','classroom','wifi','cleanliness','electrical','water','other')),
  location text not null,
  image_path text,
  status text not null default 'submitted' check (status in ('submitted','in_review','in_progress','resolved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.campus_issues(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  old_status text,
  new_status text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index if not exists idx_lost_found_created on public.lost_found_items(created_at desc);
create index if not exists idx_lost_found_type_status on public.lost_found_items(item_type, status);
create index if not exists idx_resources_subject on public.resources(subject);
create index if not exists idx_events_starts on public.events(starts_at);
create index if not exists idx_registrations_user on public.event_registrations(user_id);
create index if not exists idx_marketplace_status on public.marketplace_listings(status);
create index if not exists idx_issues_user on public.campus_issues(user_id);
create index if not exists idx_issues_status on public.campus_issues(status);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- ---------- Enable RLS ----------
alter table public.profiles enable row level security;
alter table public.lost_found_items enable row level security;
alter table public.resources enable row level security;
alter table public.clubs enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.campus_issues enable row level security;
alter table public.issue_updates enable row level security;
alter table public.notifications enable row level security;

-- ---------- Profiles policies ----------
drop policy if exists "Profiles readable by authenticated users" on public.profiles;
create policy "Profiles readable by authenticated users" on public.profiles
for select to authenticated using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated using (id = auth.uid())
with check (id = auth.uid());

-- ---------- Lost & Found policies ----------
drop policy if exists "Authenticated users read visible lost found" on public.lost_found_items;
create policy "Authenticated users read visible lost found" on public.lost_found_items
for select to authenticated using (status <> 'hidden' or user_id = auth.uid() or public.is_admin());

drop policy if exists "Users create own lost found" on public.lost_found_items;
create policy "Users create own lost found" on public.lost_found_items
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Owners or admins update lost found" on public.lost_found_items;
create policy "Owners or admins update lost found" on public.lost_found_items
for update to authenticated using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Owners or admins delete lost found" on public.lost_found_items;
create policy "Owners or admins delete lost found" on public.lost_found_items
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Resources policies ----------
drop policy if exists "Authenticated users read resources" on public.resources;
create policy "Authenticated users read resources" on public.resources
for select to authenticated using (not is_hidden or user_id = auth.uid() or public.is_admin());

drop policy if exists "Users create own resources" on public.resources;
create policy "Users create own resources" on public.resources
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Owners or admins update resources" on public.resources;
create policy "Owners or admins update resources" on public.resources
for update to authenticated using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Owners or admins delete resources" on public.resources;
create policy "Owners or admins delete resources" on public.resources
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Clubs and events policies ----------
drop policy if exists "Authenticated users read clubs" on public.clubs;
create policy "Authenticated users read clubs" on public.clubs
for select to authenticated using (true);

drop policy if exists "Admins manage clubs" on public.clubs;
create policy "Admins manage clubs" on public.clubs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users read published events" on public.events;
create policy "Authenticated users read published events" on public.events
for select to authenticated using (status = 'published' or public.is_admin() or created_by = auth.uid());

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own registrations" on public.event_registrations;
create policy "Users read own registrations" on public.event_registrations
for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users register themselves" on public.event_registrations;
create policy "Users register themselves" on public.event_registrations
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Users cancel own registrations" on public.event_registrations;
create policy "Users cancel own registrations" on public.event_registrations
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- Marketplace policies ----------
drop policy if exists "Authenticated users read available listings" on public.marketplace_listings;
create policy "Authenticated users read available listings" on public.marketplace_listings
for select to authenticated using (status <> 'hidden' or user_id = auth.uid() or public.is_admin());

drop policy if exists "Users create own listings" on public.marketplace_listings;
create policy "Users create own listings" on public.marketplace_listings
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Owners or admins update listings" on public.marketplace_listings;
create policy "Owners or admins update listings" on public.marketplace_listings
for update to authenticated using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Owners or admins delete listings" on public.marketplace_listings;
create policy "Owners or admins delete listings" on public.marketplace_listings
for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------- CampusFix policies ----------
drop policy if exists "Users read own issues admins read all" on public.campus_issues;
create policy "Users read own issues admins read all" on public.campus_issues
for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users create own issues" on public.campus_issues;
create policy "Users create own issues" on public.campus_issues
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Admins update issues" on public.campus_issues;
create policy "Admins update issues" on public.campus_issues
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users and admins read issue updates" on public.issue_updates;
create policy "Users and admins read issue updates" on public.issue_updates
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.campus_issues i
    where i.id = issue_id and i.user_id = auth.uid()
  )
);

drop policy if exists "Admins create issue updates" on public.issue_updates;
create policy "Admins create issue updates" on public.issue_updates
for insert to authenticated with check (public.is_admin());

-- ---------- Notifications policies ----------
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
for select to authenticated using (user_id = auth.uid());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications" on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Admins create notifications" on public.notifications;
create policy "Admins create notifications" on public.notifications
for insert to authenticated with check (public.is_admin());

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('lost-found', 'lost-found', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('resources', 'resources', false, 20971520, array['application/pdf','image/jpeg','image/png']),
  ('marketplace', 'marketplace', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('campus-fix', 'campus-fix', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload into their own top-level folder,
-- e.g. <auth.uid()>/<filename>. Public buckets are readable by anyone.
drop policy if exists "Public read public CampusSphere buckets" on storage.objects;
create policy "Public read public CampusSphere buckets" on storage.objects
for select using (bucket_id in ('lost-found','marketplace','campus-fix','avatars'));

drop policy if exists "Users upload own CampusSphere files" on storage.objects;
create policy "Users upload own CampusSphere files" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('lost-found','resources','marketplace','campus-fix','avatars')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own CampusSphere files" on storage.objects;
create policy "Users update own CampusSphere files" on storage.objects
for update to authenticated
using ((storage.foldername(name))[1] = auth.uid()::text)
with check ((storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own CampusSphere files" on storage.objects;
create policy "Users delete own CampusSphere files" on storage.objects
for delete to authenticated
using ((storage.foldername(name))[1] = auth.uid()::text);

-- ---------- Admin assignment ----------
-- After creating your admin account through Supabase Auth, run:
-- update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';

commit;

-- NOTE:
-- This is a hackathon starter schema, not a formal security audit.
-- Test RLS, storage access, and profile role updates before handling real student data.
