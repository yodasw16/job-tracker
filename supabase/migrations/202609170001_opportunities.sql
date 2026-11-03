-- Review against the existing project before applying. No existing tables are dropped.
begin;
create table public.opportunities (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 company text not null check (length(trim(company)) > 0),
 role text not null check (length(trim(role)) > 0),
 job_url text not null default '' check (job_url = '' or job_url ~* '^https?://'),
 salary text not null default '',
 address text not null default '',
 description text not null default '',
 status text not null default 'Interested' check (status in ('Interested','Applied','Interviewing','Offer','Rejected','Withdrawn','Closed')),
 applied_on date,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index opportunities_owner on public.opportunities(user_id);
alter table public.opportunities enable row level security;
revoke all on public.opportunities from anon;
grant select, insert, update on public.opportunities to authenticated;
create policy "Read own opportunities" on public.opportunities for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own opportunities" on public.opportunities for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own opportunities" on public.opportunities for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.job_tracker_set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger opportunities_updated_at before update on public.opportunities for each row execute function public.job_tracker_set_updated_at();
commit;
