-- CampusSphere CampusFix: timeline RLS reporter check fix

begin;

create or replace function public.campus_fix_is_reporter(p_issue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campus_issues
    where id = p_issue_id and user_id = (select auth.uid())
  );
$$;

revoke all on function public.campus_fix_is_reporter(uuid) from public, anon;
grant execute on function public.campus_fix_is_reporter(uuid) to authenticated;

drop policy if exists "Permitted users read issue timeline" on public.issue_updates;
create policy "Permitted users read issue timeline" on public.issue_updates
for select to authenticated
using (
  public.campus_fix_can_read_issue(issue_id)
  and (
    audience = 'campus'
    or public.is_admin()
    or public.campus_fix_can_manage_issue(issue_id)
    or public.campus_fix_is_reporter(issue_id)
  )
);

commit;
