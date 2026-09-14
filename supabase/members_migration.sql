create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  role text not null check (role in ('admin', 'parent', 'volunteer')),
  created_at timestamptz not null default now()
);

alter table public.workspace_members enable row level security;

create policy "authenticated can read workspace members"
on public.workspace_members
for select to authenticated
using (true);

insert into public.workspace_members (email, display_name, role)
values
  ('rosenauproductions@gmail.com', 'Jordan Miller', 'admin'),
  ('capri2_77@yahoo.com', 'Mara Ellis', 'parent'),
  ('silverlbud@gmail.com', 'Noah B.', 'volunteer')
on conflict (email) do update
set display_name = excluded.display_name,
    role = excluded.role;
