begin;
create table public.next_actions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  due_on date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index next_actions_opportunity on public.next_actions(opportunity_id);
alter table public.next_actions enable row level security;
revoke all on public.next_actions from anon;
grant select, insert, update on public.next_actions to authenticated;
create policy "Read own next actions" on public.next_actions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own next actions" on public.next_actions for insert to authenticated with check ((select auth.uid()) = user_id and exists(select 1 from public.opportunities o where o.id = opportunity_id and o.user_id = (select auth.uid())));
create policy "Update own next actions" on public.next_actions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists(select 1 from public.opportunities o where o.id = opportunity_id and o.user_id = (select auth.uid())));
commit;
