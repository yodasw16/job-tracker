-- Run as postgres in the SQL editor. Requires exactly one labeled UI test opportunity.
-- Uses simulated JWT identities, not a second account login. All writes roll back.
begin;
do $$
declare
  target_id uuid;
  owner_id uuid;
  other_id uuid := gen_random_uuid();
  activity_id uuid := gen_random_uuid();
  affected integer;
begin
  select id, user_id into strict target_id, owner_id
  from public.opportunities
  where company = 'TEST — persistence verification';

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.activities(id, opportunity_id, user_id, kind, state, occurred_on, title)
  values(activity_id, target_id, owner_id, 'Interview', 'Scheduled', date '2026-11-03', 'TEST — rollback-only activity');
  select count(*) into affected from public.activities where id = activity_id;
  if affected <> 1 then raise exception 'Owner cannot read their activity'; end if;
  update public.activities set notes = 'Rollback-only owner update' where id = activity_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner cannot update their activity'; end if;

  begin
    update public.activities set user_id = other_id where id = activity_id;
    raise exception 'Owner can transfer activity ownership';
  exception when insufficient_privilege then
    -- Expected RLS rejection; any other failure aborts the test.
    null;
  end;
  begin
    update public.activities set opportunity_id = gen_random_uuid() where id = activity_id;
    raise exception 'Owner can attach activity without an owned opportunity';
  exception when insufficient_privilege then
    null;
  end;

  perform set_config('request.jwt.claim.sub', other_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  select count(*) into affected from public.activities where id = activity_id;
  if affected <> 0 then raise exception 'Another identity can read the activity'; end if;
  update public.activities set notes = 'Forbidden update' where id = activity_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another identity can update the activity'; end if;
  begin
    insert into public.activities(opportunity_id, user_id, kind, state, occurred_on, title)
    values(target_id, owner_id, 'Contact', 'Completed', date '2026-11-03', 'Forbidden owner spoof');
    raise exception 'Another identity can insert under the owner';
  exception when insufficient_privilege then
    null;
  end;
  begin
    insert into public.activities(opportunity_id, user_id, kind, state, occurred_on, title)
    values(target_id, other_id, 'Contact', 'Completed', date '2026-11-03', 'Forbidden opportunity attachment');
    raise exception 'Another identity can attach an activity to the owner opportunity';
  exception when insufficient_privilege then
    null;
  end;
  reset role;

  select count(*) into affected from public.activities
  where id = activity_id and user_id = owner_id and opportunity_id = target_id
    and notes = 'Rollback-only owner update';
  if affected <> 1 then raise exception 'Denied writes changed the activity'; end if;
end $$;
select 'Activity owner and cross-user isolation checks passed; all writes rolled back' as verification;
rollback;
