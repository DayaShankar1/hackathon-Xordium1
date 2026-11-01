-- CampusSphere Phase 2: Resource Hub foundation
-- Apply after 202611010002_lost_found_foundation.sql.

begin;

create extension if not exists pg_trgm;

alter table public.resources
  add column if not exists branch text,
  add column if not exists file_size_bytes bigint,
  add column if not exists updated_at timestamptz,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.profiles(id) on delete set null,
  add column if not exists hidden_reason text;

update public.resources
set updated_at = coalesce(updated_at, created_at),
    hidden_at = case when is_hidden then coalesce(hidden_at, created_at) else null end
where updated_at is null or (is_hidden and hidden_at is null);

alter table public.resources
  alter column updated_at set default now();

alter table public.resources
  drop constraint if exists resources_title_length,
  drop constraint if exists resources_description_length,
  drop constraint if exists resources_subject_length,
  drop constraint if exists resources_branch_length,
  drop constraint if exists resources_semester_length,
  drop constraint if exists resources_file_path_length,
  drop constraint if exists resources_file_name_valid,
  drop constraint if exists resources_mime_type_check,
  drop constraint if exists resources_file_size_check,
  drop constraint if exists resources_hidden_reason_length;

alter table public.resources
  add constraint resources_title_length
    check (char_length(btrim(title)) between 3 and 160) not valid,
  add constraint resources_description_length
    check (description is null or char_length(btrim(description)) between 10 and 4000) not valid,
  add constraint resources_subject_length
    check (char_length(btrim(subject)) between 2 and 100) not valid,
  add constraint resources_branch_length
    check (branch is null or char_length(btrim(branch)) between 2 and 80) not valid,
  add constraint resources_semester_length
    check (semester is null or char_length(btrim(semester)) between 1 and 40) not valid,
  add constraint resources_file_path_length
    check (char_length(file_path) between 10 and 500) not valid,
  add constraint resources_file_name_valid
    check (
      char_length(btrim(file_name)) between 1 and 255
      and file_name !~ '[/\\]'
    ) not valid,
  add constraint resources_mime_type_check
    check (
      mime_type is null
      or mime_type in (
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
    ) not valid,
  add constraint resources_file_size_check
    check (file_size_bytes is null or file_size_bytes between 1 and 20971520) not valid,
  add constraint resources_hidden_reason_length
    check (hidden_reason is null or char_length(btrim(hidden_reason)) between 3 and 500) not valid;

create unique index if not exists idx_resources_file_path_unique
  on public.resources(file_path);
create index if not exists idx_resources_visible_created
  on public.resources(created_at desc) where not is_hidden;
create index if not exists idx_resources_user_created
  on public.resources(user_id, created_at desc);
create index if not exists idx_resources_subject_filter
  on public.resources(subject);
create index if not exists idx_resources_branch_filter
  on public.resources(branch);
create index if not exists idx_resources_semester_filter
  on public.resources(semester);
create index if not exists idx_resources_type_filter
  on public.resources(resource_type);
create index if not exists idx_resources_title_search
  on public.resources using gin (title gin_trgm_ops);
create index if not exists idx_resources_moderation
  on public.resources(is_hidden, created_at desc);

create or replace function public.protect_resource_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_is_admin boolean := (select auth.uid()) is null or public.is_admin();
begin
  if tg_op = 'INSERT' then
    if new.is_hidden
      or new.hidden_at is not null
      or new.hidden_by is not null
      or new.hidden_reason is not null
    then
      raise exception 'New resources must start visible' using errcode = '42501';
    end if;

    if new.description is null
      or new.branch is null
      or new.semester is null
      or new.mime_type is null
      or new.file_size_bytes is null
    then
      raise exception 'Complete resource metadata is required' using errcode = '23514';
    end if;

    if split_part(new.file_path, '/', 1) <> new.user_id::text
      or split_part(new.file_path, '/', 2) <> new.id::text
      or split_part(new.file_path, '/', 3) = ''
    then
      raise exception 'Resource file path does not match its owner and resource' using errcode = '42501';
    end if;

    new.created_at = now();
    new.updated_at = now();
    return new;
  end if;

  if new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.file_path is distinct from old.file_path
    or new.file_name is distinct from old.file_name
    or new.mime_type is distinct from old.mime_type
    or new.file_size_bytes is distinct from old.file_size_bytes
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Resource identity and file metadata are immutable' using errcode = '42501';
  end if;

  if not caller_is_admin and (
    new.is_hidden is distinct from old.is_hidden
    or new.hidden_at is distinct from old.hidden_at
    or new.hidden_by is distinct from old.hidden_by
    or new.hidden_reason is distinct from old.hidden_reason
  ) then
    raise exception 'Only administrators can moderate resources' using errcode = '42501';
  end if;

  if caller_is_admin and new.is_hidden is distinct from old.is_hidden then
    if new.is_hidden then
      if new.hidden_reason is null or char_length(btrim(new.hidden_reason)) < 3 then
        raise exception 'A moderation reason is required' using errcode = '23514';
      end if;
      new.hidden_at = now();
      new.hidden_by = (select auth.uid());
    else
      new.hidden_at = null;
      new.hidden_by = null;
      new.hidden_reason = null;
    end if;
  elsif not caller_is_admin then
    new.is_hidden = old.is_hidden;
    new.hidden_at = old.hidden_at;
    new.hidden_by = old.hidden_by;
    new.hidden_reason = old.hidden_reason;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.protect_resource_metadata() from public, anon, authenticated;

drop trigger if exists protect_resource_metadata_on_write on public.resources;
create trigger protect_resource_metadata_on_write
before insert or update on public.resources
for each row execute procedure public.protect_resource_metadata();

drop policy if exists "Authenticated users read resources" on public.resources;
create policy "Authenticated users read resources" on public.resources
for select to authenticated
using (
  not is_hidden
  or user_id = (select auth.uid())
  or public.is_admin()
);

drop policy if exists "Users create own resources" on public.resources;
create policy "Users create own resources" on public.resources
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and not is_hidden
  and split_part(file_path, '/', 1) = (select auth.uid())::text
  and split_part(file_path, '/', 2) = id::text
  and split_part(file_path, '/', 3) <> ''
);

drop policy if exists "Owners or admins update resources" on public.resources;
create policy "Owners or admins update resources" on public.resources
for update to authenticated
using (
  (user_id = (select auth.uid()) and not is_hidden)
  or public.is_admin()
)
with check (
  (user_id = (select auth.uid()) and not is_hidden)
  or public.is_admin()
);

drop policy if exists "Owners or admins delete resources" on public.resources;
create policy "Owners or admins delete resources" on public.resources
for delete to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

update storage.buckets
set public = false,
    file_size_limit = 20971520,
    allowed_mime_types = array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
where id = 'resources';

drop policy if exists "Users upload own CampusSphere files" on storage.objects;
create policy "Users upload own CampusSphere files" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('lost-found', 'marketplace', 'campus-fix', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users update own CampusSphere files" on storage.objects;
create policy "Users update own CampusSphere files" on storage.objects
for update to authenticated
using (
  bucket_id in ('lost-found', 'marketplace', 'campus-fix', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('lost-found', 'marketplace', 'campus-fix', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete own CampusSphere files" on storage.objects;
create policy "Users delete own CampusSphere files" on storage.objects
for delete to authenticated
using (
  bucket_id in ('lost-found', 'marketplace', 'campus-fix', 'avatars')
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);

drop policy if exists "Students upload resource files" on storage.objects;
create policy "Students upload resource files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'resources'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] is not null
  and storage.filename(name) <> ''
);

drop policy if exists "Authenticated read linked resource files" on storage.objects;
create policy "Authenticated read linked resource files" on storage.objects
for select to authenticated
using (
  bucket_id = 'resources'
  and exists (
    select 1
    from public.resources as resource
    where resource.file_path = name
      and split_part(name, '/', 1) = resource.user_id::text
      and (
        not resource.is_hidden
        or resource.user_id = (select auth.uid())
        or public.is_admin()
      )
  )
);

drop policy if exists "Owners or admins delete resource files" on storage.objects;
create policy "Owners or admins delete resource files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'resources'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);

commit;
