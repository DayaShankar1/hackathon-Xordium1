-- CampusSphere CampusFix: Seed standard campus authorities (Mess, Hostel, Washroom, Campus Operations)

begin;

-- Insert or update Mess Authority
insert into public.campus_fix_contacts (
  staff_name, job_title, department_id, whatsapp_number, whatsapp_consent, is_active
)
select
  'Mess Authority',
  'Mess In-Charge & Food Supervisor',
  id,
  '+919142239203',
  true,
  true
from public.campus_fix_departments
where code = 'housing'
on conflict (whatsapp_number) do update
set staff_name = excluded.staff_name,
    job_title = excluded.job_title,
    is_active = true,
    whatsapp_consent = true;

-- Insert or update Hostel Authority
insert into public.campus_fix_contacts (
  staff_name, job_title, department_id, whatsapp_number, whatsapp_consent, is_active
)
select
  'Hostel Authority',
  'Chief Hostel Warden',
  id,
  '+919142239204',
  true,
  true
from public.campus_fix_departments
where code = 'housing'
on conflict (whatsapp_number) do update
set staff_name = excluded.staff_name,
    job_title = excluded.job_title,
    is_active = true,
    whatsapp_consent = true;

-- Insert or update Washroom Authority
insert into public.campus_fix_contacts (
  staff_name, job_title, department_id, whatsapp_number, whatsapp_consent, is_active
)
select
  'Washroom Authority',
  'Sanitation & Hygiene In-Charge',
  id,
  '+919142239205',
  true,
  true
from public.campus_fix_departments
where code = 'water-sanitation'
on conflict (whatsapp_number) do update
set staff_name = excluded.staff_name,
    job_title = excluded.job_title,
    is_active = true,
    whatsapp_consent = true;

-- Insert or update Campus Authority
insert into public.campus_fix_contacts (
  staff_name, job_title, department_id, whatsapp_number, whatsapp_consent, is_active
)
select
  'Campus Authority',
  'Chief Operations Officer',
  id,
  '+919142239206',
  true,
  true
from public.campus_fix_departments
where code = 'campus-operations'
on conflict (whatsapp_number) do update
set staff_name = excluded.staff_name,
    job_title = excluded.job_title,
    is_active = true,
    whatsapp_consent = true;

commit;

