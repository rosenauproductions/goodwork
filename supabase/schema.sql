create table if not exists public.jobs (
  id text primary key,
  title text not null,
  category text not null default 'Yard',
  requestor text not null,
  volunteer text not null default 'Unassigned',
  status text not null default 'Needs review',
  risk text not null default 'Green',
  date text not null default 'Today',
  amount numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.families (
  id text primary key,
  name text not null,
  "familyType" text not null default 'Service family',
  "activeJobs" integer not null default 0,
  "totalRaised" numeric not null default 0,
  "nextStep" text not null default 'Follow up this week',
  contact text not null default '',
  status text not null default 'Healthy',
  created_at timestamptz not null default now()
);

create table if not exists public.fundraising_goals (
  id text primary key,
  label text not null,
  raised numeric not null default 0,
  target numeric not null default 1000,
  status text not null default 'On pace',
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_settings (
  id text primary key default 'default',
  church_name text not null default 'Grace Community',
  contact_email text not null default '',
  currency text not null default 'USD',
  default_job_amount numeric not null default 0,
  notifications_enabled boolean not null default true,
  theme text not null default 'light',
  font_size text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  role text not null check (role in ('admin', 'parent', 'volunteer')),
  created_at timestamptz not null default now()
);

insert into public.workspace_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.jobs enable row level security;
alter table public.families enable row level security;
alter table public.fundraising_goals enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.workspace_members enable row level security;

create policy "public can read jobs" on public.jobs for select to anon, authenticated using (true);
create policy "public can write jobs" on public.jobs for all to anon, authenticated using (true) with check (true);
create policy "public can read families" on public.families for select to anon, authenticated using (true);
create policy "public can write families" on public.families for all to anon, authenticated using (true) with check (true);
create policy "public can read fundraising goals" on public.fundraising_goals for select to anon, authenticated using (true);
create policy "public can write fundraising goals" on public.fundraising_goals for all to anon, authenticated using (true) with check (true);
create policy "public can read workspace settings" on public.workspace_settings for select to anon, authenticated using (true);
create policy "public can write workspace settings" on public.workspace_settings for all to anon, authenticated using (true) with check (true);
create policy "authenticated can read workspace members" on public.workspace_members for select to authenticated using (true);