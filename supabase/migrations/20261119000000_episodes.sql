-- Episodes (one migraine each) and the medication doses taken during them.
-- Single-user app, but every row is owned by auth.uid() and protected by RLS.

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  peak_pain smallint check (peak_pain between 1 and 10),
  locations text[] not null default '{}',
  symptoms text[] not null default '{}',
  triggers text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint episodes_end_after_start check (ended_at is null or ended_at >= started_at)
);

create index episodes_user_started_idx on public.episodes (user_id, started_at desc);

create table public.medication_doses (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.episodes (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  taken_at timestamptz,
  helped text not null default 'unknown' check (helped in ('yes', 'somewhat', 'no', 'unknown'))
);

create index medication_doses_episode_idx on public.medication_doses (episode_id);
create index medication_doses_user_idx on public.medication_doses (user_id);

-- keep updated_at fresh
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger episodes_set_updated_at
before update on public.episodes
for each row execute function public.set_updated_at();

-- access: signed-in owner only
revoke all on public.episodes, public.medication_doses from anon;
grant select, insert, update, delete on public.episodes, public.medication_doses to authenticated;

alter table public.episodes enable row level security;
alter table public.medication_doses enable row level security;

create policy "episodes: owner select" on public.episodes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "episodes: owner insert" on public.episodes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "episodes: owner update" on public.episodes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "episodes: owner delete" on public.episodes
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "doses: owner select" on public.medication_doses
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "doses: owner insert" on public.medication_doses
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.episodes e
      where e.id = episode_id and e.user_id = (select auth.uid())
    )
  );
create policy "doses: owner update" on public.medication_doses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.episodes e
      where e.id = episode_id and e.user_id = (select auth.uid())
    )
  );
create policy "doses: owner delete" on public.medication_doses
  for delete to authenticated using ((select auth.uid()) = user_id);
