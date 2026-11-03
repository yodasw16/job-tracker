-- Run as postgres in the SQL editor. Requires exactly one labeled UI test opportunity.
-- Uses simulated JWT identities, not a second account login. All writes roll back.
begin;
do $$
declare
  target_id uuid;
  owner_id uuid;
  other_id uuid := gen_random_uuid();
  action_id uuid := gen_random_uuid();
  affected integer;
begin
  select id, user_id into strict target_id, owner_id
  from public.opportunities
  where company = 'TEST — persistence verification';

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.next_actions(id, opportunity_id, user_id, title)
  values(action_id, target_id, owner_id, 'TEST — rollback-only action');
  select count(*) into affected from public.next_actions where id = action_id;
  if affected <> 1 then raise exception 'Owner cannot read their action'; end if;
  update public.next_actions set title = 'Rollback-only owner update' where id = action_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner cannot update their action'; end if;

  begin
    update public.next_actions set user_id = other_id where id = action_id;
    raise exception 'Owner can transfer action ownership';
  exception when insufficient_privilege then
    -- Expected RLS rejection; any other failure aborts the test.
    null;
  end;
  begin
    update public.next_actions set opportunity_id = gen_random_uuid() where id = action_id;
    raise exception 'Owner can attach action without an owned opportunity';
  exception when insufficient_privilege then
    null;
  end;

  perform set_config('request.jwt.claim.sub', other_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  select count(*) into affected from public.next_actions where id = action_id;
  if affected <> 0 then raise exception 'Another identity can read the action'; end if;
  update public.next_actions set title = 'Forbidden update' where id = action_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another identity can update the action'; end if;
  begin
    insert into public.next_actions(opportunity_id, user_id, title)
    values(target_id, owner_id, 'Forbidden owner spoof');
    raise exception 'Another identity can insert under the owner';
  exception when insufficient_privilege then
    null;
  end;
  begin
    insert into public.next_actions(opportunity_id, user_id, title)
    values(target_id, other_id, 'Forbidden opportunity attachment');
    raise exception 'Another identity can attach an action to the owner opportunity';
  exception when insufficient_privilege then
    null;
  end;
  reset role;

  select count(*) into affected from public.next_actions
  where id = action_id and user_id = owner_id and opportunity_id = target_id
    and title = 'Rollback-only owner update';
  if affected <> 1 then raise exception 'Denied writes changed the action'; end if;
end $$;
select 'Next action owner and cross-user isolation checks passed; all writes rolled back' as verification;
rollback;
