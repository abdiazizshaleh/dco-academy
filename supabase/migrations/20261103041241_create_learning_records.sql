-- One atomic learning snapshot per signed-in account. Never expose private records to anonymous visitors.
create table public.learning_records (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (
    jsonb_typeof(state) = 'object'
    and state ->> 'version' = '1'
    and octet_length(state::text) <= 2097152
  ),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.learning_records enable row level security;
revoke all on public.learning_records from anon, authenticated;
grant select, insert, update on public.learning_records to authenticated;
create policy "Read own learning record" on public.learning_records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own learning record" on public.learning_records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own learning record" on public.learning_records
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
