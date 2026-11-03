-- Run as postgres in the SQL editor after creating the labeled UI test record.
-- All test writes are rolled back; no second login or persistent user is created.
begin;
do $$
declare
  target_id uuid;
  owner_id uuid;
  other_id uuid := gen_random_uuid();
  affected integer;
begin
  select id, user_id into strict target_id, owner_id
  from public.opportunities
  where company = 'TEST — persistence verification';

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', owner_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into affected from public.opportunities where id = target_id;
  if affected <> 1 then raise exception 'Owner cannot read their record'; end if;
  update public.opportunities set salary = 'Rollback-only owner update' where id = target_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owner cannot update their record'; end if;

  perform set_config('request.jwt.claim.sub', other_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  select count(*) into affected from public.opportunities where id = target_id;
  if affected <> 0 then raise exception 'Another identity can read the record'; end if;
  update public.opportunities set salary = 'Must not be written' where id = target_id;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Another identity can update the record'; end if;
  begin
    insert into public.opportunities(user_id, company, role) values(owner_id, 'Forbidden ownership test', 'Test');
    raise exception 'Another identity can insert under the owner';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;
select 'Owner read/update and cross-user read/update/insert checks passed' as verification;
rollback;
