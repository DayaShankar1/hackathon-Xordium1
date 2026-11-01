-- CampusSphere Phase 1: Lost & Found foundation
-- Apply after supabase/schema.sql in the Supabase SQL Editor.

begin;

create extension if not exists pg_trgm;

alter table public.lost_found_items
  add column if not exists is_hidden boolean not null default false,
  add column if not exists resolved_at timestamptz;

update public.lost_found_items
set is_hidden = true,
    status = 'open'
where status = 'hidden';

alter table public.lost_found_items
  drop constraint if exists lost_found_items_status_check,
  drop constraint if exists lost_found_items_title_length,
  drop constraint if exists lost_found_items_description_length,
  drop constraint if exists lost_found_items_category_length,
  drop constraint if exists lost_found_items_location_length;

alter table public.lost_found_items
  add constraint lost_found_items_status_check
    check (status in ('open', 'claimed', 'resolved')),
  add constraint lost_found_items_title_length
    check (char_length(btrim(title)) between 3 and 100),
  add constraint lost_found_items_description_length
    check (char_length(btrim(description)) between 10 and 2000),
  add constraint lost_found_items_category_length
    check (char_length(btrim(category)) between 2 and 50),
  add constraint lost_found_items_location_length
    check (char_length(btrim(location)) between 2 and 120);

create table if not exists public.lost_found_item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.lost_found_items(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  object_path text not null unique check (char_length(object_path) between 10 and 500),
  sort_order smallint not null check (sort_order between 0 and 4),
  created_at timestamptz not null default now(),
  unique (item_id, sort_order)
);

insert into public.lost_found_item_images (item_id, uploaded_by, object_path, sort_order)
select id, user_id, image_path, 0
from public.lost_found_items
where image_path is not null and btrim(image_path) <> ''
on conflict do nothing;

create table if not exists public.lost_found_claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.lost_found_items(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  statement text not null check (char_length(btrim(statement)) between 10 and 1000),
  identifying_details text not null check (char_length(btrim(identifying_details)) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lost_found_user_created
  on public.lost_found_items(user_id, created_at desc);
create index if not exists idx_lost_found_active_created
  on public.lost_found_items(is_hidden, status, created_at desc);
create index if not exists idx_lost_found_category
  on public.lost_found_items(category);
create index if not exists idx_lost_found_title_search
  on public.lost_found_items using gin (title gin_trgm_ops);
create index if not exists idx_lost_found_location_search
  on public.lost_found_items using gin (location gin_trgm_ops);
create index if not exists idx_lost_found_images_item
  on public.lost_found_item_images(item_id, sort_order);
create index if not exists idx_lost_found_claims_item_status
  on public.lost_found_claims(item_id, status);
create index if not exists idx_lost_found_claims_claimant
  on public.lost_found_claims(claimant_id, created_at desc);
create unique index if not exists idx_lost_found_claims_pending_unique
  on public.lost_found_claims(item_id, claimant_id)
  where status = 'pending';
create unique index if not exists idx_lost_found_claims_approved_unique
  on public.lost_found_claims(item_id)
  where status = 'approved';

create or replace function public.protect_lost_found_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_is_admin boolean := (select auth.uid()) is null or public.is_admin();
begin
  if tg_op = 'INSERT' then
    if new.status <> 'open' or new.is_hidden or new.resolved_at is not null then
      raise exception 'New reports must start open and visible' using errcode = '42501';
    end if;

    new.created_at = now();
    new.updated_at = now();
    return new;
  end if;

  if new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Report ownership and identity are immutable' using errcode = '42501';
  end if;

  if not caller_is_admin then
    if old.is_hidden or new.is_hidden is distinct from old.is_hidden then
      raise exception 'Only administrators can change report visibility' using errcode = '42501';
    end if;

    if new.status is distinct from old.status then
      if old.status = 'open' and new.status = 'claimed' then
        if not exists (
          select 1 from public.lost_found_claims
          where item_id = old.id and status = 'approved'
        ) then
          raise exception 'A report requires an approved claim before it can be claimed' using errcode = '42501';
        end if;
      elsif not (
        (old.status = 'open' and new.status = 'resolved')
        or (old.status = 'claimed' and new.status = 'resolved')
      ) then
        raise exception 'Invalid report status transition' using errcode = '42501';
      end if;
    end if;
  end if;

  if new.status = 'resolved' and old.status <> 'resolved' then
    new.resolved_at = now();
  elsif new.status <> 'resolved' then
    new.resolved_at = null;
  else
    new.resolved_at = old.resolved_at;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.protect_lost_found_item() from public, anon, authenticated;

drop trigger if exists protect_lost_found_item_on_write on public.lost_found_items;
create trigger protect_lost_found_item_on_write
before insert or update on public.lost_found_items
for each row execute procedure public.protect_lost_found_item();

create or replace function public.review_lost_found_claim(
  claim_id uuid,
  decision text
)
returns public.lost_found_claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_row public.lost_found_claims%rowtype;
  item_owner uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;

  select *
  into claim_row
  from public.lost_found_claims
  where id = claim_id
  for update;

  if not found then
    raise exception 'Claim not found' using errcode = 'P0002';
  end if;

  select user_id
  into item_owner
  from public.lost_found_items
  where id = claim_row.item_id
  for update;

  if not found then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  if item_owner <> (select auth.uid()) and not public.is_admin() then
    raise exception 'Only the report owner can review this claim' using errcode = '42501';
  end if;

  if claim_row.status <> 'pending' then
    raise exception 'This claim has already been reviewed' using errcode = '23514';
  end if;

  update public.lost_found_claims
  set status = decision,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = claim_id
  returning * into claim_row;

  if decision = 'approved' then
    update public.lost_found_claims
    set status = 'rejected',
        reviewed_by = (select auth.uid()),
        reviewed_at = now(),
        updated_at = now()
    where item_id = claim_row.item_id
      and id <> claim_row.id
      and status = 'pending';

    update public.lost_found_items
    set status = 'claimed'
    where id = claim_row.item_id and status = 'open';
  end if;

  return claim_row;
end;
$$;

revoke all on function public.review_lost_found_claim(uuid, text) from public, anon;
grant execute on function public.review_lost_found_claim(uuid, text) to authenticated;

alter table public.lost_found_item_images enable row level security;
alter table public.lost_found_claims enable row level security;

drop policy if exists "Authenticated users read visible lost found" on public.lost_found_items;
create policy "Authenticated users read visible lost found" on public.lost_found_items
for select to authenticated
using (not is_hidden or user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users create own lost found" on public.lost_found_items;
create policy "Users create own lost found" on public.lost_found_items
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'open'
  and not is_hidden
  and resolved_at is null
);

drop policy if exists "Owners or admins update lost found" on public.lost_found_items;
create policy "Owners or admins update lost found" on public.lost_found_items
for update to authenticated
using ((user_id = (select auth.uid()) and not is_hidden) or public.is_admin())
with check ((user_id = (select auth.uid()) and not is_hidden) or public.is_admin());

drop policy if exists "Owners or admins delete lost found" on public.lost_found_items;
create policy "Owners or admins delete lost found" on public.lost_found_items
for delete to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Users read visible lost found images" on public.lost_found_item_images;
create policy "Users read visible lost found images" on public.lost_found_item_images
for select to authenticated
using (
  exists (
    select 1 from public.lost_found_items as items
    where items.id = item_id
      and (not items.is_hidden or items.user_id = (select auth.uid()) or public.is_admin())
  )
);

drop policy if exists "Owners add lost found images" on public.lost_found_item_images;
create policy "Owners add lost found images" on public.lost_found_item_images
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.lost_found_items as items
    where items.id = item_id and items.user_id = (select auth.uid()) and not items.is_hidden
  )
);

drop policy if exists "Owners delete lost found images" on public.lost_found_item_images;
create policy "Owners delete lost found images" on public.lost_found_item_images
for delete to authenticated
using (
  uploaded_by = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "Claim participants read private claims" on public.lost_found_claims;
create policy "Claim participants read private claims" on public.lost_found_claims
for select to authenticated
using (
  claimant_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.lost_found_items as items
    where items.id = item_id and items.user_id = (select auth.uid())
  )
);

drop policy if exists "Students submit private claims" on public.lost_found_claims;
create policy "Students submit private claims" on public.lost_found_claims
for insert to authenticated
with check (
  claimant_id = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and exists (
    select 1 from public.lost_found_items as items
    where items.id = item_id
      and items.item_type = 'found'
      and items.status = 'open'
      and not items.is_hidden
      and items.user_id <> (select auth.uid())
  )
);

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'lost-found';

drop policy if exists "Public read public CampusSphere buckets" on storage.objects;
create policy "Public read public CampusSphere buckets" on storage.objects
for select
using (bucket_id in ('marketplace', 'campus-fix', 'avatars'));

drop policy if exists "Authenticated read lost found images" on storage.objects;
create policy "Authenticated read lost found images" on storage.objects
for select to authenticated
using (
  bucket_id = 'lost-found'
  and exists (
    select 1
    from public.lost_found_item_images as images
    join public.lost_found_items as items on items.id = images.item_id
    where images.object_path = name
      and (not items.is_hidden or items.user_id = (select auth.uid()) or public.is_admin())
  )
);

drop policy if exists "Users update own CampusSphere files" on storage.objects;
create policy "Users update own CampusSphere files" on storage.objects
for update to authenticated
using (
  bucket_id in ('lost-found', 'resources', 'marketplace', 'campus-fix', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('lost-found', 'resources', 'marketplace', 'campus-fix', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete own CampusSphere files" on storage.objects;
create policy "Users delete own CampusSphere files" on storage.objects
for delete to authenticated
using (
  bucket_id in ('lost-found', 'resources', 'marketplace', 'campus-fix', 'avatars')
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);

commit;
