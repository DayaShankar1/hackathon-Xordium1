-- CampusSphere Phase 3: CampusFix issue reporting and resolution foundation
-- Apply after 202611010003_resource_hub_foundation.sql.

begin;

select pg_advisory_xact_lock(hashtext('campussphere-campus-fix-v1'));
create extension if not exists pg_trgm;

-- ---------- Departments and authorized contacts ----------
create table if not exists public.campus_fix_departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,50}$'),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  description text check (description is null or char_length(btrim(description)) between 3 and 500),
  default_sla_hours smallint not null default 72 check (default_sla_hours between 1 and 720),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.campus_fix_departments (code, name, description, default_sla_hours)
values
  ('it-services', 'IT Services', 'Campus network, internet and computer lab support.', 24),
  ('electrical-maintenance', 'Electrical Maintenance', 'Electricity and electrical safety issues.', 24),
  ('water-sanitation', 'Water and Sanitation', 'Water supply and washroom maintenance.', 24),
  ('academic-facilities', 'Academic Facilities', 'Classroom, library and teaching-space maintenance.', 72),
  ('housing', 'Hostel and Housing', 'Hostel facilities and residential maintenance.', 48),
  ('campus-security', 'Campus Security', 'Security, access and safety incidents.', 4),
  ('campus-operations', 'Campus Operations', 'General campus maintenance and uncategorized issues.', 72)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    default_sla_hours = excluded.default_sla_hours,
    updated_at = now();

create table if not exists public.campus_fix_category_routes (
  category text primary key,
  department_id uuid not null references public.campus_fix_departments(id) on delete restrict,
  default_priority text not null default 'medium' check (default_priority in ('low', 'medium', 'high', 'critical')),
  is_active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.campus_fix_category_routes (category, department_id, default_priority)
select route.category, department.id, route.default_priority
from (
  values
    ('network', 'it-services', 'high'),
    ('computer_lab', 'it-services', 'medium'),
    ('electricity', 'electrical-maintenance', 'high'),
    ('water', 'water-sanitation', 'high'),
    ('classroom', 'academic-facilities', 'medium'),
    ('hostel', 'housing', 'medium'),
    ('library', 'academic-facilities', 'medium'),
    ('washroom', 'water-sanitation', 'high'),
    ('security', 'campus-security', 'critical'),
    ('other', 'campus-operations', 'medium')
) as route(category, department_code, default_priority)
join public.campus_fix_departments as department on department.code = route.department_code
on conflict (category) do update
set department_id = excluded.department_id,
    default_priority = excluded.default_priority,
    is_active = true,
    updated_at = now();

create table if not exists public.campus_fix_contacts (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.campus_fix_departments(id) on delete restrict,
  profile_id uuid references public.profiles(id) on delete set null,
  staff_name text not null check (char_length(btrim(staff_name)) between 2 and 100),
  job_title text check (job_title is null or char_length(btrim(job_title)) between 2 and 100),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+[1-9][0-9]{7,14}$'),
  whatsapp_consent boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_campus_fix_contacts_profile
  on public.campus_fix_contacts(profile_id) where profile_id is not null;
create unique index if not exists idx_campus_fix_contacts_whatsapp
  on public.campus_fix_contacts(whatsapp_number) where whatsapp_number is not null;

create table if not exists public.campus_fix_contact_scopes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.campus_fix_contacts(id) on delete cascade,
  category text,
  building text,
  can_view boolean not null default true,
  can_update_status boolean not null default true,
  can_add_evidence boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (category is not null or building is not null),
  check (category is null or category in ('network', 'computer_lab', 'electricity', 'water', 'classroom', 'hostel', 'library', 'washroom', 'security', 'other')),
  unique (contact_id, category, building)
);

-- ---------- Upgrade issues ----------
alter table public.campus_issues
  drop constraint if exists campus_issues_category_check,
  drop constraint if exists campus_issues_status_check,
  drop constraint if exists campus_issues_user_id_fkey;

alter table public.campus_issues
  alter column user_id drop not null;

alter table public.campus_issues
  add constraint campus_issues_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.campus_issues
  add column if not exists reference_id text,
  add column if not exists reporter_name text,
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists building text,
  add column if not exists priority text not null default 'medium',
  add column if not exists moderation_status text not null default 'visible',
  add column if not exists moderation_reason text,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists department_id uuid references public.campus_fix_departments(id) on delete restrict,
  add column if not exists assigned_contact_id uuid references public.campus_fix_contacts(id) on delete set null,
  add column if not exists assigned_staff_name text,
  add column if not exists estimated_resolution_at timestamptz,
  add column if not exists resolution_notes text,
  add column if not exists rejection_reason text,
  add column if not exists duplicate_of_issue_id uuid references public.campus_issues(id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists reopened_at timestamptz,
  add column if not exists agree_count integer not null default 0,
  add column if not exists disagree_count integer not null default 0,
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists version bigint not null default 1;

update public.campus_issues set category = 'network' where category = 'wifi';
update public.campus_issues set category = 'electricity' where category = 'electrical';
update public.campus_issues set category = 'washroom' where category = 'cleanliness';
update public.campus_issues set status = 'acknowledged' where status = 'in_review';

update public.campus_issues as issue
set reference_id = coalesce(issue.reference_id, 'CF-' || upper(replace(issue.id::text, '-', ''))),
    reporter_name = coalesce(
      issue.reporter_name,
      case
        when issue.is_anonymous then 'Anonymous student'
        else (select profile.display_name from public.profiles as profile where profile.id = issue.user_id)
      end,
      'Former student'
    ),
    building = coalesce(nullif(btrim(issue.building), ''), 'Campus'),
    priority = coalesce(issue.priority, 'medium'),
    last_activity_at = greatest(issue.created_at, issue.updated_at),
    resolved_at = case when issue.status = 'resolved' then coalesce(issue.resolved_at, issue.updated_at) else issue.resolved_at end;

update public.campus_issues as issue
set department_id = coalesce(issue.department_id, route.department_id),
    priority = coalesce(issue.priority, route.default_priority, 'medium')
from public.campus_fix_category_routes as route
where route.category = issue.category;

alter table public.campus_issues
  alter column reference_id set not null,
  alter column reporter_name set not null,
  alter column building set not null,
  alter column department_id set not null;

alter table public.campus_issues
  add constraint campus_issues_category_check
    check (category in ('network', 'computer_lab', 'electricity', 'water', 'classroom', 'hostel', 'library', 'washroom', 'security', 'other')),
  add constraint campus_issues_status_check
    check (status in ('submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected')),
  add constraint campus_issues_priority_check
    check (priority in ('low', 'medium', 'high', 'critical')),
  add constraint campus_issues_moderation_check
    check (moderation_status in ('visible', 'hidden', 'deleted')),
  add constraint campus_issues_title_length
    check (char_length(btrim(title)) between 5 and 160) not valid,
  add constraint campus_issues_description_length
    check (char_length(btrim(description)) between 20 and 4000) not valid,
  add constraint campus_issues_building_length
    check (char_length(btrim(building)) between 2 and 120) not valid,
  add constraint campus_issues_location_length
    check (char_length(btrim(location)) between 2 and 200) not valid,
  add constraint campus_issues_vote_counts_check
    check (agree_count >= 0 and disagree_count >= 0),
  add constraint campus_issues_version_check
    check (version > 0),
  add constraint campus_issues_resolution_notes_check
    check (resolution_notes is null or char_length(btrim(resolution_notes)) between 10 and 4000) not valid,
  add constraint campus_issues_rejection_reason_check
    check (rejection_reason is null or char_length(btrim(rejection_reason)) between 5 and 1000) not valid;

create unique index if not exists idx_campus_issues_reference on public.campus_issues(reference_id);
create index if not exists idx_campus_issues_feed on public.campus_issues(moderation_status, status, created_at desc);
create index if not exists idx_campus_issues_owner on public.campus_issues(user_id, created_at desc);
create index if not exists idx_campus_issues_queue on public.campus_issues(department_id, status, priority, created_at desc);
create index if not exists idx_campus_issues_due on public.campus_issues(estimated_resolution_at)
  where status in ('submitted', 'acknowledged', 'in_progress', 'reopened');
create index if not exists idx_campus_issues_support on public.campus_issues(agree_count desc, created_at desc)
  where moderation_status = 'visible';
create index if not exists idx_campus_issues_title_search on public.campus_issues using gin (title gin_trgm_ops);
create index if not exists idx_campus_issues_description_search on public.campus_issues using gin (description gin_trgm_ops);

-- ---------- Immutable timeline ----------
alter table public.issue_updates
  add column if not exists event_type text not null default 'status_changed',
  add column if not exists audience text not null default 'campus',
  add column if not exists actor_kind text not null default 'admin',
  add column if not exists request_id uuid,
  add column if not exists payload jsonb not null default '{}'::jsonb;

update public.issue_updates
set event_type = case when old_status is null then 'created' else 'status_changed' end,
    audience = 'campus',
    actor_kind = case when actor_id is null then 'system' else 'admin' end
where event_type = 'status_changed';

alter table public.issue_updates
  add constraint issue_updates_event_type_check
    check (event_type in ('created', 'status_changed', 'note_added', 'assigned', 'reassigned', 'evidence_added', 'reopened', 'moderated', 'restored')),
  add constraint issue_updates_audience_check
    check (audience in ('campus', 'reporter', 'staff')),
  add constraint issue_updates_actor_kind_check
    check (actor_kind in ('reporter', 'staff', 'admin', 'system')),
  add constraint issue_updates_old_status_check
    check (old_status is null or old_status in ('submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected')) not valid,
  add constraint issue_updates_new_status_check
    check (new_status in ('submitted', 'acknowledged', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected')) not valid,
  add constraint issue_updates_note_length
    check (note is null or char_length(btrim(note)) between 3 and 4000) not valid,
  add constraint issue_updates_payload_object
    check (jsonb_typeof(payload) = 'object');

create index if not exists idx_issue_updates_timeline on public.issue_updates(issue_id, created_at, id);
create unique index if not exists idx_issue_updates_request on public.issue_updates(request_id) where request_id is not null;

insert into public.issue_updates (
  issue_id, actor_id, old_status, new_status, event_type, audience, actor_kind, note, payload, created_at
)
select issue.id, issue.user_id, null, issue.status, 'created', 'campus', 'reporter', 'Issue submitted', '{}'::jsonb, issue.created_at
from public.campus_issues as issue
where not exists (
  select 1 from public.issue_updates as update_row where update_row.issue_id = issue.id
);

-- ---------- Evidence, votes, assignments and notifications ----------
create table if not exists public.campus_issue_evidence (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.campus_issues(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  evidence_type text not null check (evidence_type in ('report', 'progress', 'resolution')),
  object_path text not null unique check (char_length(object_path) between 20 and 500),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255 and file_name !~ '[/\\]'),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes bigint not null check (file_size_bytes between 1 and 5242880),
  caption text check (caption is null or char_length(btrim(caption)) between 2 and 500),
  sort_order smallint not null default 0 check (sort_order between 0 and 9),
  created_at timestamptz not null default now()
);

create table if not exists public.campus_issue_votes (
  issue_id uuid not null references public.campus_issues(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  vote text not null check (vote in ('agree', 'disagree')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (issue_id, voter_id)
);

create table if not exists public.campus_issue_assignments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.campus_issues(id) on delete cascade,
  department_id uuid not null references public.campus_fix_departments(id) on delete restrict,
  contact_id uuid not null references public.campus_fix_contacts(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  ended_by uuid references public.profiles(id) on delete set null,
  ended_at timestamptz,
  reason text check (reason is null or char_length(btrim(reason)) between 3 and 500)
);

create unique index if not exists idx_campus_issue_active_assignment
  on public.campus_issue_assignments(issue_id) where ended_at is null;
create index if not exists idx_campus_issue_assignment_contact
  on public.campus_issue_assignments(contact_id, assigned_at desc);
create index if not exists idx_campus_issue_evidence_issue
  on public.campus_issue_evidence(issue_id, evidence_type, sort_order);
create index if not exists idx_campus_issue_votes_voter
  on public.campus_issue_votes(voter_id, updated_at desc);

create table if not exists public.campus_fix_notification_logs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.campus_issues(id) on delete cascade,
  issue_update_id uuid references public.issue_updates(id) on delete set null,
  contact_id uuid references public.campus_fix_contacts(id) on delete set null,
  event_type text not null check (event_type in ('issue_created', 'issue_assigned', 'status_changed')),
  channel text not null default 'whatsapp' check (channel = 'whatsapp'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'suppressed', 'accepted', 'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered')),
  idempotency_key text not null unique,
  attempt_count smallint not null default 0 check (attempt_count between 0 and 5),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  provider_message_sid text unique,
  provider_status text,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz
);

create table if not exists public.campus_fix_notification_events (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.campus_fix_notification_logs(id) on delete cascade,
  event_key text not null unique,
  status text not null,
  error_code text,
  error_message text,
  signature_verified boolean not null default false,
  provider_at timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists idx_campus_fix_notification_queue
  on public.campus_fix_notification_logs(status, next_attempt_at)
  where status in ('pending', 'failed');
create index if not exists idx_campus_fix_notification_issue
  on public.campus_fix_notification_logs(issue_id, created_at desc);

-- ---------- Authorization helpers ----------
create or replace function public.campus_fix_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin();
$$;

create or replace function public.campus_fix_can_manage_issue(p_issue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.campus_issues as issue
    join public.campus_fix_contacts as contact
      on contact.profile_id = (select auth.uid()) and contact.is_active
    where issue.id = p_issue_id
      and (
        issue.assigned_contact_id = contact.id
        or exists (
          select 1
          from public.campus_fix_contact_scopes as scope
          where scope.contact_id = contact.id
            and scope.can_update_status
            and (scope.category is null or scope.category = issue.category)
            and (scope.building is null or lower(scope.building) = lower(issue.building))
        )
      )
  );
$$;

create or replace function public.campus_fix_can_read_issue(p_issue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campus_issues as issue
    where issue.id = p_issue_id
      and (
        (issue.moderation_status = 'visible' and (select auth.uid()) is not null)
        or issue.user_id = (select auth.uid())
        or public.campus_fix_can_manage_issue(issue.id)
      )
  );
$$;

create or replace function public.campus_fix_issue_permissions(p_issue_id uuid)
returns table (
  is_reporter boolean,
  can_manage boolean,
  is_admin boolean,
  actual_reporter_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    issue.user_id = (select auth.uid()),
    public.campus_fix_can_manage_issue(issue.id),
    public.is_admin(),
    case
      when issue.user_id = (select auth.uid()) or public.campus_fix_can_manage_issue(issue.id)
        then coalesce(profile.display_name, 'Former student')
      else issue.reporter_name
    end
  from public.campus_issues as issue
  left join public.profiles as profile on profile.id = issue.user_id
  where issue.id = p_issue_id and public.campus_fix_can_read_issue(issue.id);
$$;

revoke all on function public.campus_fix_is_admin() from public, anon;
revoke all on function public.campus_fix_can_manage_issue(uuid) from public, anon;
revoke all on function public.campus_fix_can_read_issue(uuid) from public, anon;
revoke all on function public.campus_fix_issue_permissions(uuid) from public, anon;
grant execute on function public.campus_fix_is_admin() to authenticated;
grant execute on function public.campus_fix_can_manage_issue(uuid) to authenticated;
grant execute on function public.campus_fix_can_read_issue(uuid) to authenticated;
grant execute on function public.campus_fix_issue_permissions(uuid) to authenticated;

-- ---------- Write guards and internal helpers ----------
create or replace function public.guard_campus_issue_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('campusfix.internal_write', true) <> 'on' then
    raise exception 'CampusFix issues may only be changed through approved workflows' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.reference_id is distinct from old.reference_id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Issue identity and reporter are immutable' using errcode = '42501';
  end if;

  new.updated_at = now();
  new.last_activity_at = now();
  if tg_op = 'UPDATE' then new.version = old.version + 1; end if;
  return new;
end;
$$;

create or replace function public.prevent_immutable_campus_fix_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'CampusFix audit rows are immutable' using errcode = '42501';
end;
$$;

drop trigger if exists guard_campus_issue_write_on_change on public.campus_issues;
create trigger guard_campus_issue_write_on_change
before insert or update on public.campus_issues
for each row execute procedure public.guard_campus_issue_write();

drop trigger if exists prevent_issue_update_changes on public.issue_updates;
create trigger prevent_issue_update_changes
before update or delete on public.issue_updates
for each row execute procedure public.prevent_immutable_campus_fix_rows();

drop trigger if exists prevent_notification_event_changes on public.campus_fix_notification_events;
create trigger prevent_notification_event_changes
before update or delete on public.campus_fix_notification_events
for each row execute procedure public.prevent_immutable_campus_fix_rows();

revoke all on function public.guard_campus_issue_write() from public, anon, authenticated;
revoke all on function public.prevent_immutable_campus_fix_rows() from public, anon, authenticated;

create or replace function public.campus_fix_append_update(
  p_issue_id uuid,
  p_actor_id uuid,
  p_old_status text,
  p_new_status text,
  p_event_type text,
  p_audience text,
  p_actor_kind text,
  p_note text,
  p_request_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  update_id uuid;
begin
  insert into public.issue_updates (
    issue_id, actor_id, old_status, new_status, event_type, audience,
    actor_kind, note, request_id, payload
  ) values (
    p_issue_id, p_actor_id, p_old_status, p_new_status, p_event_type, p_audience,
    p_actor_kind, nullif(btrim(p_note), ''), p_request_id, coalesce(p_payload, '{}'::jsonb)
  ) returning id into update_id;
  return update_id;
end;
$$;

revoke all on function public.campus_fix_append_update(uuid, uuid, text, text, text, text, text, text, uuid, jsonb)
from public, anon, authenticated;

-- ---------- Student submission and editing ----------
create or replace function public.campus_fix_submit_issue(
  p_issue_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_building text,
  p_location text,
  p_priority text,
  p_is_anonymous boolean,
  p_evidence jsonb,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  profile_name text;
  route_row public.campus_fix_category_routes%rowtype;
  department_row public.campus_fix_departments%rowtype;
  contact_row public.campus_fix_contacts%rowtype;
  issue_row public.campus_issues%rowtype;
  evidence_item jsonb;
  evidence_index integer := 0;
  assignment_id uuid;
  update_id uuid;
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_category not in ('network', 'computer_lab', 'electricity', 'water', 'classroom', 'hostel', 'library', 'washroom', 'security', 'other') then
    raise exception 'Invalid issue category' using errcode = '22023';
  end if;
  if p_priority not in ('low', 'medium', 'high', 'critical') then
    raise exception 'Invalid issue priority' using errcode = '22023';
  end if;
  if char_length(btrim(p_title)) not between 5 and 160
    or char_length(btrim(p_description)) not between 20 and 4000
    or char_length(btrim(p_building)) not between 2 and 120
    or char_length(btrim(p_location)) not between 2 and 200
  then
    raise exception 'Issue fields failed validation' using errcode = '23514';
  end if;
  if jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_evidence, '[]'::jsonb)) > 3 then
    raise exception 'Up to three evidence images are allowed' using errcode = '23514';
  end if;

  select display_name into profile_name from public.profiles where id = actor_id;
  select * into route_row from public.campus_fix_category_routes where category = p_category and is_active;
  if not found then raise exception 'No active department route exists for this category' using errcode = 'P0002'; end if;
  select * into department_row from public.campus_fix_departments where id = route_row.department_id and is_active;

  perform set_config('campusfix.internal_write', 'on', true);
  insert into public.campus_issues (
    id, user_id, reference_id, reporter_name, is_anonymous, title, description,
    category, building, location, priority, status, moderation_status,
    department_id, estimated_resolution_at, agree_count, disagree_count,
    created_at, updated_at, last_activity_at, version
  ) values (
    p_issue_id, actor_id, 'CF-' || upper(replace(p_issue_id::text, '-', '')),
    case when p_is_anonymous then 'Anonymous student' else coalesce(profile_name, 'CampusSphere student') end,
    p_is_anonymous, btrim(p_title), btrim(p_description), p_category,
    btrim(p_building), btrim(p_location), p_priority, 'submitted', 'visible',
    department_row.id, now() + make_interval(hours => department_row.default_sla_hours),
    0, 0, now(), now(), now(), 1
  ) returning * into issue_row;

  update_id := public.campus_fix_append_update(
    issue_row.id, actor_id, null, 'submitted', 'created', 'campus', 'reporter',
    'Issue submitted', p_request_id,
    jsonb_build_object('priority', issue_row.priority, 'department_id', issue_row.department_id)
  );

  for evidence_item in select value from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb)) loop
    if evidence_item->>'object_path' not like actor_id::text || '/' || p_issue_id::text || '/%'
      or evidence_item->>'mime_type' not in ('image/jpeg', 'image/png', 'image/webp')
      or coalesce((evidence_item->>'file_size_bytes')::bigint, 0) not between 1 and 5242880
    then
      raise exception 'Evidence metadata is invalid' using errcode = '42501';
    end if;
    insert into public.campus_issue_evidence (
      id, issue_id, uploaded_by, evidence_type, object_path, file_name,
      mime_type, file_size_bytes, caption, sort_order
    ) values (
      coalesce((evidence_item->>'id')::uuid, gen_random_uuid()), p_issue_id, actor_id, 'report',
      evidence_item->>'object_path', evidence_item->>'file_name', evidence_item->>'mime_type',
      (evidence_item->>'file_size_bytes')::bigint, nullif(evidence_item->>'caption', ''), evidence_index
    );
    evidence_index := evidence_index + 1;
  end loop;

  select contact.* into contact_row
  from public.campus_fix_contacts as contact
  where contact.department_id = department_row.id
    and contact.is_active
    and exists (
      select 1 from public.campus_fix_contact_scopes as scope
      where scope.contact_id = contact.id
        and (scope.category is null or scope.category = p_category)
        and (scope.building is null or lower(scope.building) = lower(btrim(p_building)))
    )
  order by case when exists (
    select 1 from public.campus_fix_contact_scopes as exact_scope
    where exact_scope.contact_id = contact.id and exact_scope.category = p_category
  ) then 0 else 1 end, contact.created_at
  limit 1;

  if contact_row.id is not null then
    insert into public.campus_issue_assignments (
      issue_id, department_id, contact_id, assigned_by, reason
    ) values (p_issue_id, department_row.id, contact_row.id, null, 'Automatic category routing')
    returning id into assignment_id;

    update public.campus_issues
    set assigned_contact_id = contact_row.id,
        assigned_staff_name = contact_row.staff_name
    where id = p_issue_id
    returning * into issue_row;

    perform public.campus_fix_append_update(
      issue_row.id, null, issue_row.status, issue_row.status, 'assigned', 'campus', 'system',
      'Issue routed to ' || contact_row.staff_name, null,
      jsonb_build_object('assignment_id', assignment_id, 'department_id', department_row.id)
    );

    insert into public.campus_fix_notification_logs (
      issue_id, issue_update_id, contact_id, event_type, status, idempotency_key
    ) values (
      issue_row.id, update_id, contact_row.id, 'issue_created',
      case when contact_row.whatsapp_consent and contact_row.whatsapp_number is not null then 'pending' else 'suppressed' end,
      issue_row.id::text || ':issue_created:' || contact_row.id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  return issue_row;
end;
$$;

create or replace function public.campus_fix_edit_issue(
  p_issue_id uuid,
  p_title text,
  p_description text,
  p_building text,
  p_location text,
  p_priority text,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  issue_row public.campus_issues%rowtype;
begin
  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  if issue_row.user_id <> (select auth.uid()) or issue_row.status <> 'submitted' then
    raise exception 'Only the reporter may edit a submitted issue' using errcode = '42501';
  end if;
  if issue_row.moderation_status <> 'visible' then raise exception 'Moderated issues cannot be edited' using errcode = '42501'; end if;
  if p_priority not in ('low', 'medium', 'high', 'critical') then raise exception 'Invalid priority' using errcode = '22023'; end if;

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set title = btrim(p_title), description = btrim(p_description), building = btrim(p_building),
      location = btrim(p_location), priority = p_priority
  where id = p_issue_id
  returning * into issue_row;

  perform public.campus_fix_append_update(
    p_issue_id, (select auth.uid()), issue_row.status, issue_row.status,
    'note_added', 'reporter', 'reporter', 'Reporter updated issue details', p_request_id, '{}'::jsonb
  );
  return issue_row;
end;
$$;

-- ---------- Voting ----------
create or replace function public.campus_fix_set_vote(p_issue_id uuid, p_vote text)
returns table (agree_count integer, disagree_count integer, user_vote text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  issue_row public.campus_issues%rowtype;
  agree_total integer;
  disagree_total integer;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_vote not in ('agree', 'disagree') then raise exception 'Vote must be agree or disagree' using errcode = '22023'; end if;

  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  if issue_row.moderation_status <> 'visible'
    or issue_row.status not in ('submitted', 'acknowledged', 'in_progress', 'reopened')
  then
    raise exception 'This issue is not eligible for voting' using errcode = '42501';
  end if;

  insert into public.campus_issue_votes (issue_id, voter_id, vote)
  values (p_issue_id, (select auth.uid()), p_vote)
  on conflict (issue_id, voter_id) do update
  set vote = excluded.vote, updated_at = now();

  select count(*) filter (where vote = 'agree'), count(*) filter (where vote = 'disagree')
  into agree_total, disagree_total
  from public.campus_issue_votes
  where issue_id = p_issue_id;

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set agree_count = agree_total, disagree_count = disagree_total
  where id = p_issue_id;

  return query select agree_total, disagree_total, p_vote;
end;
$$;

-- ---------- Lifecycle, notes and evidence ----------
create or replace function public.campus_fix_transition_issue(
  p_issue_id uuid,
  p_expected_version bigint,
  p_new_status text,
  p_note text,
  p_resolution_notes text,
  p_rejection_reason text,
  p_estimated_resolution_at timestamptz,
  p_evidence jsonb,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  issue_row public.campus_issues%rowtype;
  old_status text;
  actor_kind text;
  update_id uuid;
  evidence_item jsonb;
  evidence_index integer := 0;
begin
  if actor_id is null or not public.campus_fix_can_manage_issue(p_issue_id) then
    raise exception 'Authorized staff or administrator access is required' using errcode = '42501';
  end if;

  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  if issue_row.version <> p_expected_version then raise exception 'Issue changed; refresh and retry' using errcode = '40001'; end if;
  if issue_row.moderation_status <> 'visible' then raise exception 'Moderated issues cannot change status' using errcode = '42501'; end if;
  if p_new_status not in ('acknowledged', 'in_progress', 'resolved', 'closed', 'rejected') then
    raise exception 'Invalid target status' using errcode = '22023';
  end if;

  if not (
    (issue_row.status = 'submitted' and p_new_status in ('acknowledged', 'rejected'))
    or (issue_row.status = 'acknowledged' and p_new_status in ('in_progress', 'resolved', 'rejected'))
    or (issue_row.status = 'in_progress' and p_new_status in ('acknowledged', 'resolved', 'rejected'))
    or (issue_row.status = 'reopened' and p_new_status in ('acknowledged', 'in_progress', 'resolved', 'rejected'))
    or (issue_row.status = 'resolved' and p_new_status = 'closed')
  ) then
    raise exception 'Invalid CampusFix status transition' using errcode = '23514';
  end if;

  if p_new_status = 'resolved' and char_length(btrim(coalesce(p_resolution_notes, ''))) < 10 then
    raise exception 'Resolution notes are required' using errcode = '23514';
  end if;
  if p_new_status = 'rejected' and char_length(btrim(coalesce(p_rejection_reason, ''))) < 5 then
    raise exception 'A rejection reason is required' using errcode = '23514';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) < 3 then
    raise exception 'A staff update note is required' using errcode = '23514';
  end if;
  if jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_evidence, '[]'::jsonb)) > 3 then
    raise exception 'Up to three evidence images are allowed' using errcode = '23514';
  end if;

  old_status := issue_row.status;
  actor_kind := case when public.is_admin() then 'admin' else 'staff' end;
  perform set_config('campusfix.internal_write', 'on', true);

  update public.campus_issues
  set status = p_new_status,
      estimated_resolution_at = coalesce(p_estimated_resolution_at, estimated_resolution_at),
      resolution_notes = case when p_new_status = 'resolved' then btrim(p_resolution_notes) else resolution_notes end,
      rejection_reason = case when p_new_status = 'rejected' then btrim(p_rejection_reason) else rejection_reason end,
      resolved_at = case when p_new_status = 'resolved' then now() else resolved_at end,
      closed_at = case when p_new_status = 'closed' then now() else closed_at end
  where id = p_issue_id
  returning * into issue_row;

  update_id := public.campus_fix_append_update(
    p_issue_id, actor_id, old_status, p_new_status, 'status_changed', 'campus', actor_kind,
    btrim(p_note), p_request_id,
    jsonb_build_object(
      'resolution_notes', case when p_new_status = 'resolved' then btrim(p_resolution_notes) else null end,
      'rejection_reason', case when p_new_status = 'rejected' then btrim(p_rejection_reason) else null end,
      'estimated_resolution_at', p_estimated_resolution_at
    )
  );

  for evidence_item in select value from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb)) loop
    if (evidence_item->>'object_path') not like (actor_id::text || '/' || p_issue_id::text || '/%')
      or evidence_item->>'mime_type' not in ('image/jpeg', 'image/png', 'image/webp')
      or coalesce((evidence_item->>'file_size_bytes')::bigint, 0) not between 1 and 5242880
    then
      raise exception 'Evidence metadata is invalid' using errcode = '42501';
    end if;
    insert into public.campus_issue_evidence (
      id, issue_id, uploaded_by, evidence_type, object_path, file_name,
      mime_type, file_size_bytes, caption, sort_order
    ) values (
      coalesce((evidence_item->>'id')::uuid, gen_random_uuid()), p_issue_id, actor_id,
      case when p_new_status in ('resolved', 'closed') then 'resolution' else 'progress' end,
      evidence_item->>'object_path', evidence_item->>'file_name', evidence_item->>'mime_type',
      (evidence_item->>'file_size_bytes')::bigint, nullif(evidence_item->>'caption', ''), evidence_index
    );
    evidence_index := evidence_index + 1;
  end loop;

  if issue_row.assigned_contact_id is not null then
    insert into public.campus_fix_notification_logs (
      issue_id, issue_update_id, contact_id, event_type, status, idempotency_key
    ) values (
      issue_row.id, update_id, issue_row.assigned_contact_id, 'status_changed', 'pending',
      issue_row.id::text || ':status:' || p_new_status || ':' || p_request_id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  return issue_row;
end;
$$;

create or replace function public.campus_fix_add_update(
  p_issue_id uuid,
  p_expected_version bigint,
  p_note text,
  p_estimated_resolution_at timestamptz,
  p_evidence jsonb,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  issue_row public.campus_issues%rowtype;
  actor_kind text;
  evidence_item jsonb;
  evidence_index integer := 0;
begin
  if actor_id is null or not public.campus_fix_can_manage_issue(p_issue_id) then
    raise exception 'Authorized staff or administrator access is required' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_note, ''))) < 3 then raise exception 'An update note is required' using errcode = '23514'; end if;
  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found or issue_row.version <> p_expected_version then raise exception 'Issue changed; refresh and retry' using errcode = '40001'; end if;

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set estimated_resolution_at = coalesce(p_estimated_resolution_at, estimated_resolution_at)
  where id = p_issue_id
  returning * into issue_row;

  actor_kind := case when public.is_admin() then 'admin' else 'staff' end;
  perform public.campus_fix_append_update(
    p_issue_id, actor_id, issue_row.status, issue_row.status, 'note_added', 'campus', actor_kind,
    btrim(p_note), p_request_id, jsonb_build_object('estimated_resolution_at', p_estimated_resolution_at)
  );

  for evidence_item in select value from jsonb_array_elements(coalesce(p_evidence, '[]'::jsonb)) loop
    if (evidence_item->>'object_path') not like (actor_id::text || '/' || p_issue_id::text || '/%') then
      raise exception 'Evidence path is invalid' using errcode = '42501';
    end if;
    insert into public.campus_issue_evidence (
      id, issue_id, uploaded_by, evidence_type, object_path, file_name, mime_type,
      file_size_bytes, caption, sort_order
    ) values (
      coalesce((evidence_item->>'id')::uuid, gen_random_uuid()), p_issue_id, actor_id, 'progress',
      evidence_item->>'object_path', evidence_item->>'file_name', evidence_item->>'mime_type',
      (evidence_item->>'file_size_bytes')::bigint, nullif(evidence_item->>'caption', ''), evidence_index
    );
    evidence_index := evidence_index + 1;
  end loop;
  return issue_row;
end;
$$;

-- ---------- Reopen, assignment and moderation ----------
create or replace function public.campus_fix_reopen_issue(
  p_issue_id uuid,
  p_reason text,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  issue_row public.campus_issues%rowtype;
  old_status text;
begin
  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  if actor_id is null or (issue_row.user_id <> actor_id and not public.campus_fix_can_manage_issue(p_issue_id)) then
    raise exception 'Only the reporter or authorized staff can reopen this issue' using errcode = '42501';
  end if;
  if issue_row.status not in ('resolved', 'closed', 'rejected') then raise exception 'Only terminal issues can be reopened' using errcode = '23514'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 10 then raise exception 'A reopen reason is required' using errcode = '23514'; end if;

  old_status := issue_row.status;
  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set status = 'reopened', reopened_at = now(), resolved_at = null, closed_at = null,
      rejection_reason = null, resolution_notes = null
  where id = p_issue_id
  returning * into issue_row;

  perform public.campus_fix_append_update(
    p_issue_id, actor_id, old_status, 'reopened', 'reopened', 'campus',
    case when public.campus_fix_can_manage_issue(p_issue_id) and issue_row.user_id <> actor_id then 'staff' else 'reporter' end,
    btrim(p_reason), p_request_id, '{}'::jsonb
  );
  return issue_row;
end;
$$;

create or replace function public.campus_fix_assign_issue(
  p_issue_id uuid,
  p_contact_id uuid,
  p_reason text,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  issue_row public.campus_issues%rowtype;
  contact_row public.campus_fix_contacts%rowtype;
  assignment_id uuid;
  event_type text;
  update_id uuid;
begin
  if actor_id is null or not public.is_admin() then raise exception 'Administrator access is required' using errcode = '42501'; end if;
  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  select * into contact_row from public.campus_fix_contacts where id = p_contact_id and is_active;
  if not found then raise exception 'Active contact not found' using errcode = 'P0002'; end if;

  event_type := case when issue_row.assigned_contact_id is null then 'assigned' else 'reassigned' end;
  update public.campus_issue_assignments
  set ended_at = now(), ended_by = actor_id
  where issue_id = p_issue_id and ended_at is null;

  insert into public.campus_issue_assignments (
    issue_id, department_id, contact_id, assigned_by, reason
  ) values (
    p_issue_id, contact_row.department_id, contact_row.id, actor_id, nullif(btrim(p_reason), '')
  ) returning id into assignment_id;

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set department_id = contact_row.department_id,
      assigned_contact_id = contact_row.id,
      assigned_staff_name = contact_row.staff_name
  where id = p_issue_id
  returning * into issue_row;

  update_id := public.campus_fix_append_update(
    p_issue_id, actor_id, issue_row.status, issue_row.status, event_type, 'campus', 'admin',
    coalesce(nullif(btrim(p_reason), ''), 'Issue assigned to ' || contact_row.staff_name),
    p_request_id, jsonb_build_object('assignment_id', assignment_id, 'contact_id', contact_row.id)
  );

  insert into public.campus_fix_notification_logs (
    issue_id, issue_update_id, contact_id, event_type, status, idempotency_key
  ) values (
    p_issue_id, update_id, contact_row.id, 'issue_assigned',
    case when contact_row.whatsapp_consent and contact_row.whatsapp_number is not null then 'pending' else 'suppressed' end,
    p_issue_id::text || ':assignment:' || assignment_id::text
  ) on conflict (idempotency_key) do nothing;
  return issue_row;
end;
$$;

create or replace function public.campus_fix_moderate_issue(
  p_issue_id uuid,
  p_action text,
  p_reason text,
  p_duplicate_of uuid,
  p_request_id uuid
)
returns public.campus_issues
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  issue_row public.campus_issues%rowtype;
begin
  if actor_id is null or not public.is_admin() then raise exception 'Administrator access is required' using errcode = '42501'; end if;
  if p_action not in ('hide', 'restore', 'delete', 'duplicate') then raise exception 'Invalid moderation action' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'A moderation reason is required' using errcode = '23514'; end if;
  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;
  if p_action = 'duplicate' and p_duplicate_of is null then raise exception 'Duplicate issue reference is required' using errcode = '23514'; end if;

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set moderation_status = case p_action when 'restore' then 'visible' when 'delete' then 'deleted' else 'hidden' end,
      moderation_reason = case when p_action = 'restore' then null else btrim(p_reason) end,
      moderated_by = case when p_action = 'restore' then null else actor_id end,
      moderated_at = case when p_action = 'restore' then null else now() end,
      duplicate_of_issue_id = case when p_action = 'duplicate' then p_duplicate_of else duplicate_of_issue_id end,
      status = case when p_action = 'duplicate' then 'rejected' else status end,
      rejection_reason = case when p_action = 'duplicate' then btrim(p_reason) else rejection_reason end
  where id = p_issue_id
  returning * into issue_row;

  perform public.campus_fix_append_update(
    p_issue_id, actor_id, issue_row.status, issue_row.status,
    case when p_action = 'restore' then 'restored' else 'moderated' end,
    'reporter', 'admin', btrim(p_reason), p_request_id,
    jsonb_build_object('action', p_action, 'duplicate_of', p_duplicate_of)
  );
  return issue_row;
end;
$$;

-- ---------- Durable notification worker RPCs ----------
create or replace function public.campus_fix_claim_notifications(p_limit integer default 10)
returns setof public.campus_fix_notification_logs
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select log.id
    from public.campus_fix_notification_logs as log
    join public.campus_fix_contacts as contact on contact.id = log.contact_id
    where log.status in ('pending', 'failed')
      and log.next_attempt_at <= now()
      and log.attempt_count < 5
      and contact.is_active
      and contact.whatsapp_consent
      and contact.whatsapp_number is not null
      and (
        select count(*)
        from public.campus_fix_notification_logs as recent
        where recent.contact_id = log.contact_id
          and recent.updated_at > now() - interval '10 minutes'
          and recent.status in ('processing', 'accepted', 'queued', 'sent', 'delivered', 'read')
      ) < 3
    order by log.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  update public.campus_fix_notification_logs as log
  set status = 'processing',
      attempt_count = log.attempt_count + 1,
      locked_at = now(),
      updated_at = now()
  from candidates
  where log.id = candidates.id
  returning log.*;
end;
$$;

create or replace function public.campus_fix_complete_notification(
  p_notification_id uuid,
  p_status text,
  p_provider_message_sid text,
  p_provider_status text,
  p_error_code text,
  p_error_message text
)
returns public.campus_fix_notification_logs
language plpgsql
security definer
set search_path = ''
as $$
declare
  log_row public.campus_fix_notification_logs%rowtype;
begin
  if p_status not in ('accepted', 'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered', 'suppressed') then
    raise exception 'Invalid notification status' using errcode = '22023';
  end if;
  update public.campus_fix_notification_logs
  set status = p_status,
      provider_message_sid = coalesce(p_provider_message_sid, provider_message_sid),
      provider_status = coalesce(p_provider_status, provider_status),
      last_error_code = p_error_code,
      last_error_message = left(p_error_message, 1000),
      locked_at = null,
      next_attempt_at = case when p_status = 'failed' and attempt_count < 5
        then now() + make_interval(mins => least(60, attempt_count * attempt_count * 5))
        else next_attempt_at end,
      accepted_at = case when p_status in ('accepted', 'queued', 'sent', 'delivered', 'read') then coalesce(accepted_at, now()) else accepted_at end,
      sent_at = case when p_status in ('sent', 'delivered', 'read') then coalesce(sent_at, now()) else sent_at end,
      delivered_at = case when p_status in ('delivered', 'read') then coalesce(delivered_at, now()) else delivered_at end,
      updated_at = now()
  where id = p_notification_id
  returning * into log_row;
  if not found then raise exception 'Notification log not found' using errcode = 'P0002'; end if;
  return log_row;
end;
$$;

create or replace function public.campus_fix_record_notification_event(
  p_provider_message_sid text,
  p_event_key text,
  p_status text,
  p_error_code text,
  p_error_message text,
  p_provider_at timestamptz,
  p_signature_verified boolean
)
returns public.campus_fix_notification_logs
language plpgsql
security definer
set search_path = ''
as $$
declare
  log_row public.campus_fix_notification_logs%rowtype;
begin
  select * into log_row
  from public.campus_fix_notification_logs
  where provider_message_sid = p_provider_message_sid
  for update;
  if not found then raise exception 'Notification log not found' using errcode = 'P0002'; end if;

  insert into public.campus_fix_notification_events (
    notification_id, event_key, status, error_code, error_message,
    signature_verified, provider_at
  ) values (
    log_row.id, p_event_key, p_status, p_error_code, left(p_error_message, 1000),
    p_signature_verified, p_provider_at
  ) on conflict (event_key) do nothing;

  if p_status in ('accepted', 'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered') then
    update public.campus_fix_notification_logs
    set status = p_status,
        provider_status = p_status,
        last_error_code = p_error_code,
        last_error_message = left(p_error_message, 1000),
        sent_at = case when p_status in ('sent', 'delivered', 'read') then coalesce(sent_at, p_provider_at, now()) else sent_at end,
        delivered_at = case when p_status in ('delivered', 'read') then coalesce(delivered_at, p_provider_at, now()) else delivered_at end,
        updated_at = now()
    where id = log_row.id
    returning * into log_row;
  end if;
  return log_row;
end;
$$;

revoke all on function public.campus_fix_claim_notifications(integer) from public, anon, authenticated;
revoke all on function public.campus_fix_complete_notification(uuid, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.campus_fix_record_notification_event(text, text, text, text, text, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.campus_fix_claim_notifications(integer) to service_role;
grant execute on function public.campus_fix_complete_notification(uuid, text, text, text, text, text) to service_role;
grant execute on function public.campus_fix_record_notification_event(text, text, text, text, text, timestamptz, boolean) to service_role;

-- ---------- Function grants ----------
revoke all on function public.campus_fix_submit_issue(uuid, text, text, text, text, text, text, boolean, jsonb, uuid) from public, anon;
revoke all on function public.campus_fix_edit_issue(uuid, text, text, text, text, text, uuid) from public, anon;
revoke all on function public.campus_fix_set_vote(uuid, text) from public, anon;
revoke all on function public.campus_fix_transition_issue(uuid, bigint, text, text, text, text, timestamptz, jsonb, uuid) from public, anon;
revoke all on function public.campus_fix_add_update(uuid, bigint, text, timestamptz, jsonb, uuid) from public, anon;
revoke all on function public.campus_fix_reopen_issue(uuid, text, uuid) from public, anon;
revoke all on function public.campus_fix_assign_issue(uuid, uuid, text, uuid) from public, anon;
revoke all on function public.campus_fix_moderate_issue(uuid, text, text, uuid, uuid) from public, anon;

grant execute on function public.campus_fix_submit_issue(uuid, text, text, text, text, text, text, boolean, jsonb, uuid) to authenticated;
grant execute on function public.campus_fix_edit_issue(uuid, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.campus_fix_set_vote(uuid, text) to authenticated;
grant execute on function public.campus_fix_transition_issue(uuid, bigint, text, text, text, text, timestamptz, jsonb, uuid) to authenticated;
grant execute on function public.campus_fix_add_update(uuid, bigint, text, timestamptz, jsonb, uuid) to authenticated;
grant execute on function public.campus_fix_reopen_issue(uuid, text, uuid) to authenticated;
grant execute on function public.campus_fix_assign_issue(uuid, uuid, text, uuid) to authenticated;
grant execute on function public.campus_fix_moderate_issue(uuid, text, text, uuid, uuid) to authenticated;

-- ---------- RLS ----------
alter table public.campus_fix_departments enable row level security;
alter table public.campus_fix_category_routes enable row level security;
alter table public.campus_fix_contacts enable row level security;
alter table public.campus_fix_contact_scopes enable row level security;
alter table public.campus_issue_evidence enable row level security;
alter table public.campus_issue_votes enable row level security;
alter table public.campus_issue_assignments enable row level security;
alter table public.campus_fix_notification_logs enable row level security;
alter table public.campus_fix_notification_events enable row level security;

drop policy if exists "Users read own issues admins read all" on public.campus_issues;
drop policy if exists "Users create own issues" on public.campus_issues;
drop policy if exists "Admins update issues" on public.campus_issues;
create policy "Authenticated users read permitted campus issues" on public.campus_issues
for select to authenticated using (public.campus_fix_can_read_issue(id));

revoke select on public.campus_issues from authenticated;
grant select (
  id, reference_id, reporter_name, is_anonymous, title, description, category,
  building, location, image_path, status, priority, moderation_status,
  moderation_reason, moderated_by, moderated_at, department_id,
  assigned_contact_id, assigned_staff_name, estimated_resolution_at,
  resolution_notes, rejection_reason, duplicate_of_issue_id, resolved_at,
  closed_at, reopened_at, agree_count, disagree_count, created_at, updated_at,
  last_activity_at, version
) on public.campus_issues to authenticated;

drop policy if exists "Users and admins read issue updates" on public.issue_updates;
drop policy if exists "Admins create issue updates" on public.issue_updates;
create policy "Permitted users read issue timeline" on public.issue_updates
for select to authenticated
using (
  public.campus_fix_can_read_issue(issue_id)
  and (
    audience = 'campus'
    or public.is_admin()
    or public.campus_fix_can_manage_issue(issue_id)
    or exists (
      select 1 from public.campus_issues as issue
      where issue.id = issue_id and issue.user_id = (select auth.uid())
    )
  )
);

create policy "Authenticated users read active departments" on public.campus_fix_departments
for select to authenticated using (is_active or public.is_admin());
create policy "Admins manage departments" on public.campus_fix_departments
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users read category routes" on public.campus_fix_category_routes
for select to authenticated using (is_active or public.is_admin());
create policy "Admins manage category routes" on public.campus_fix_category_routes
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Staff read own contact admins read all" on public.campus_fix_contacts
for select to authenticated using (profile_id = (select auth.uid()) or public.is_admin());
create policy "Admins manage contacts" on public.campus_fix_contacts
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Staff read own scopes admins read all" on public.campus_fix_contact_scopes
for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.campus_fix_contacts as contact
    where contact.id = contact_id and contact.profile_id = (select auth.uid())
  )
);
create policy "Admins manage contact scopes" on public.campus_fix_contact_scopes
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Permitted users read issue evidence" on public.campus_issue_evidence
for select to authenticated using (public.campus_fix_can_read_issue(issue_id));

create policy "Users read own votes operators read issue votes" on public.campus_issue_votes
for select to authenticated using (
  voter_id = (select auth.uid())
  or public.is_admin()
  or public.campus_fix_can_manage_issue(issue_id)
);

create policy "Permitted users read assignments" on public.campus_issue_assignments
for select to authenticated using (public.campus_fix_can_read_issue(issue_id));

create policy "Admins and recipient staff read notification logs" on public.campus_fix_notification_logs
for select to authenticated using (
  public.is_admin()
  or exists (
    select 1 from public.campus_fix_contacts as contact
    where contact.id = contact_id and contact.profile_id = (select auth.uid())
  )
);
create policy "Admins read notification callback events" on public.campus_fix_notification_events
for select to authenticated using (public.is_admin());

-- ---------- Private CampusFix Storage ----------
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'campus-fix';

drop policy if exists "Public read public CampusSphere buckets" on storage.objects;
create policy "Public read public CampusSphere buckets" on storage.objects
for select using (bucket_id in ('marketplace', 'avatars'));

drop policy if exists "Users upload own CampusSphere files" on storage.objects;
create policy "Users upload own CampusSphere files" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('lost-found', 'marketplace', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users update own CampusSphere files" on storage.objects;
create policy "Users update own CampusSphere files" on storage.objects
for update to authenticated
using (
  bucket_id in ('lost-found', 'marketplace', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('lost-found', 'marketplace', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete own CampusSphere files" on storage.objects;
create policy "Users delete own CampusSphere files" on storage.objects
for delete to authenticated
using (
  bucket_id in ('lost-found', 'marketplace', 'avatars')
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);

drop policy if exists "CampusFix users upload evidence" on storage.objects;
create policy "CampusFix users upload evidence" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'campus-fix'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] is not null
  and (storage.foldername(name))[3] is not null
);

drop policy if exists "Permitted users read CampusFix evidence" on storage.objects;
create policy "Permitted users read CampusFix evidence" on storage.objects
for select to authenticated
using (
  bucket_id = 'campus-fix'
  and exists (
    select 1 from public.campus_issue_evidence as evidence
    where evidence.object_path = name
      and public.campus_fix_can_read_issue(evidence.issue_id)
  )
);

drop policy if exists "CampusFix users clean unlinked evidence" on storage.objects;
create policy "CampusFix users clean unlinked evidence" on storage.objects
for delete to authenticated
using (
  bucket_id = 'campus-fix'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] = (select auth.uid())::text
      and not exists (
        select 1 from public.campus_issue_evidence as evidence where evidence.object_path = name
      )
    )
  )
);

-- Keep issue and timeline refresh optional; normal queries remain the source of truth.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'campus_issues'
  ) then
    alter publication supabase_realtime add table public.campus_issues;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'issue_updates'
  ) then
    alter publication supabase_realtime add table public.issue_updates;
  end if;
end;
$$;

commit;
