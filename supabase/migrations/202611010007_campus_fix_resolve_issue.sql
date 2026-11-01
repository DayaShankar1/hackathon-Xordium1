-- CampusSphere CampusFix: direct issue resolution option for reporters, staff and admins

begin;

create or replace function public.campus_fix_resolve_issue(
  p_issue_id uuid,
  p_resolution_notes text default null,
  p_request_id uuid default gen_random_uuid()
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
  notes text;
  actor_kind text;
  update_id uuid;
begin
  select * into issue_row from public.campus_issues where id = p_issue_id for update;
  if not found then raise exception 'Issue not found' using errcode = 'P0002'; end if;

  if actor_id is null or (issue_row.user_id <> actor_id and not public.campus_fix_can_manage_issue(p_issue_id)) then
    raise exception 'Only the reporter, authorized staff or administrators can resolve this issue' using errcode = '42501';
  end if;

  if issue_row.status in ('resolved', 'closed', 'rejected') then
    raise exception 'This issue is already resolved or closed' using errcode = '23514';
  end if;

  if issue_row.moderation_status <> 'visible' then
    raise exception 'Moderated issues cannot be resolved' using errcode = '42501';
  end if;

  old_status := issue_row.status;
  actor_kind := case
    when public.is_admin() then 'admin'
    when public.campus_fix_can_manage_issue(p_issue_id) and issue_row.user_id <> actor_id then 'staff'
    else 'reporter'
  end;

  notes := coalesce(
    nullif(btrim(p_resolution_notes), ''),
    case when actor_kind = 'reporter' then 'Marked as resolved by student reporter.' else 'Marked as resolved by maintenance staff.' end
  );

  perform set_config('campusfix.internal_write', 'on', true);
  update public.campus_issues
  set status = 'resolved',
      resolved_at = now(),
      resolution_notes = notes,
      updated_at = now(),
      last_activity_at = now(),
      version = version + 1
  where id = p_issue_id
  returning * into issue_row;

  update_id := public.campus_fix_append_update(
    p_issue_id, actor_id, old_status, 'resolved', 'status_changed', 'campus', actor_kind,
    notes, p_request_id,
    jsonb_build_object('resolution_notes', notes)
  );

  if issue_row.assigned_contact_id is not null then
    insert into public.campus_fix_notification_logs (
      issue_id, issue_update_id, contact_id, event_type, status, idempotency_key
    ) values (
      issue_row.id, update_id, issue_row.assigned_contact_id, 'status_changed', 'pending',
      issue_row.id::text || ':status:resolved:' || p_request_id::text
    ) on conflict (idempotency_key) do nothing;
  end if;

  return issue_row;
end;
$$;

revoke all on function public.campus_fix_resolve_issue(uuid, text, uuid) from public, anon;
grant execute on function public.campus_fix_resolve_issue(uuid, text, uuid) to authenticated;

commit;

