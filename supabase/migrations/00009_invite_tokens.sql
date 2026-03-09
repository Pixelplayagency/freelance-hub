create table if not exists invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  created_by uuid references profiles(id) on delete cascade,
  used_by uuid references profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table invite_tokens enable row level security;

-- Admins can create and read tokens
create policy "admins_manage_invite_tokens" on invite_tokens
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can read a token by value (to validate it on the join page)
create policy "public_read_invite_token" on invite_tokens
  for select using (true);
