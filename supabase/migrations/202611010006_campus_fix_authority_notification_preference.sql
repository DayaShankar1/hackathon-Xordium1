-- CampusSphere CampusFix: reporter authority-notification preference

begin;

alter table public.campus_issues
  add column if not exists notify_authority boolean not null default true;

alter function public.campus_fix_submit_issue(
  uuid, text, text, text, text, text, text, boolean, jsonb, uuid
) rename to campus_fix_submit_issue_internal;

revoke all on function public.campus_fix_submit_issue_internal(
  uuid, text, text, text, text, text, text, boolean, jsonb, uuid
) from public, anon, authenticated;

create function public.campus_fix_submit_issue(
  p_issue_id uuid,
  p_title text,
  p_description text,
  p_category text,
  p_building text,
  p_location text,
  p_priority text,
  p_is_anonymous boolean,
  p_notify_authority boolean,
  p_evidence jsonb,
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
  issue_row := public.campus_fix_submit_issue_internal(
    p_issue_id, p_title, p_description, p_category, p_building, p_location,
    p_priority, p_is_anonymous, p_evidence, p_request_id
  );

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set notify_authority = coalesce(p_notify_authority, true)
  where id = p_issue_id
  returning * into issue_row;

  if not coalesce(p_notify_authority, true) then
    update public.campus_fix_notification_logs
    set status = 'suppressed',
        last_error_code = 'reporter_opt_out',
        last_error_message = 'Reporter chose not to notify the matched authority.',
        updated_at = now()
    where issue_id = p_issue_id and status = 'pending';
  end if;

  return issue_row;
end;
$$;

revoke all on function public.campus_fix_submit_issue(
  uuid, text, text, text, text, text, text, boolean, boolean, jsonb, uuid
) from public, anon;
grant execute on function public.campus_fix_submit_issue(
  uuid, text, text, text, text, text, text, boolean, boolean, jsonb, uuid
) to authenticated;

grant select (notify_authority) on public.campus_issues to authenticated;

commit;
