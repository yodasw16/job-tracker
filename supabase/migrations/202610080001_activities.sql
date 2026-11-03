begin;
create table public.activities (
 id uuid primary key default gen_random_uuid(),
 opportunity_id uuid not null references public.opportunities(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('Interview','Contact')),
 state text not null check (state in ('Scheduled','Completed','Cancelled')),
 occurred_on date not null,
 title text not null check (length(trim(title)) > 0),
 notes text not null default '',
 created_at timestamptz not null default now()
);
create index activities_opportunity on public.activities(opportunity_id);
alter table public.activities enable row level security;
revoke all on public.activities from anon;
grant select, insert, update on public.activities to authenticated;
create policy "Read own activities" on public.activities for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own activities" on public.activities for insert to authenticated with check ((select auth.uid()) = user_id and exists(select 1 from public.opportunities o where o.id = opportunity_id and o.user_id = (select auth.uid())));
create policy "Update own activities" on public.activities for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists(select 1 from public.opportunities o where o.id = opportunity_id and o.user_id = (select auth.uid())));
commit;
