-- CampusSphere CampusFix: Fix WhatsApp notification routing, scopes, and claim limits

begin;

-- 1. Ensure all standard authorities have the verified WhatsApp number and active consent
update public.campus_fix_contacts
set whatsapp_number = '+919142239202',
    whatsapp_consent = true,
    is_active = true,
    updated_at = now()
where staff_name in (
  'IT Services Authority',
  'Mess Authority',
  'Hostel Authority',
  'Washroom Authority',
  'Campus Authority'
);

-- 2. Add scopes for missing categories (electricity, water, classroom, library, security)
-- Water -> Washroom Authority
insert into public.campus_fix_contact_scopes (contact_id, category, building, can_view, can_update_status, can_add_evidence)
select c.id, 'water', null, true, true, true
from public.campus_fix_contacts c
where c.staff_name = 'Washroom Authority'
and not exists (
  select 1 from public.campus_fix_contact_scopes s where s.contact_id = c.id and s.category = 'water'
);

-- Electricity -> Campus Authority
insert into public.campus_fix_contact_scopes (contact_id, category, building, can_view, can_update_status, can_add_evidence)
select c.id, 'electricity', null, true, true, true
from public.campus_fix_contacts c
where c.staff_name = 'Campus Authority'
and not exists (
  select 1 from public.campus_fix_contact_scopes s where s.contact_id = c.id and s.category = 'electricity'
);

-- Classroom -> Campus Authority
insert into public.campus_fix_contact_scopes (contact_id, category, building, can_view, can_update_status, can_add_evidence)
select c.id, 'classroom', null, true, true, true
from public.campus_fix_contacts c
where c.staff_name = 'Campus Authority'
and not exists (
  select 1 from public.campus_fix_contact_scopes s where s.contact_id = c.id and s.category = 'classroom'
);

-- Library -> Campus Authority
insert into public.campus_fix_contact_scopes (contact_id, category, building, can_view, can_update_status, can_add_evidence)
select c.id, 'library', null, true, true, true
from public.campus_fix_contacts c
where c.staff_name = 'Campus Authority'
and not exists (
  select 1 from public.campus_fix_contact_scopes s where s.contact_id = c.id and s.category = 'library'
);

-- Security -> Campus Authority
insert into public.campus_fix_contact_scopes (contact_id, category, building, can_view, can_update_status, can_add_evidence)
select c.id, 'security', null, true, true, true
from public.campus_fix_contacts c
where c.staff_name = 'Campus Authority'
and not exists (
  select 1 from public.campus_fix_contact_scopes s where s.contact_id = c.id and s.category = 'security'
);

-- 3. Replace campus_fix_claim_notifications with relaxed rate limits and auto-unlocking of stale locks
create or replace function public.campus_fix_claim_notifications(p_limit integer default 10)
returns setof public.campus_fix_notification_logs
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Automatically unlock any notifications stuck in 'processing' for more than 3 minutes
  update public.campus_fix_notification_logs
  set status = 'pending', locked_at = null
  where status = 'processing'
    and locked_at < now() - interval '3 minutes';

  return query
  with candidates as (
    select log.id
    from public.campus_fix_notification_logs as log
    join public.campus_fix_contacts as contact on contact.id = log.contact_id
    where log.status in ('pending', 'failed')
      and log.next_attempt_at <= now() + interval '5 seconds'
      and log.attempt_count < 10
      and contact.is_active
      and contact.whatsapp_consent
      and contact.whatsapp_number is not null
    order by log.created_at desc
    for update of log skip locked
    limit p_limit
  )
  update public.campus_fix_notification_logs as target
  set status = 'processing',
      locked_at = now(),
      attempt_count = target.attempt_count + 1,
      updated_at = now()
  from candidates
  where target.id = candidates.id
  returning target.*;
end;
$$;

revoke all on function public.campus_fix_claim_notifications(integer) from public, anon;
grant execute on function public.campus_fix_claim_notifications(integer) to authenticated;

commit;
