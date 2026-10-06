-- Tabla de usuarios sincronizada con Supabase Auth
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  tenant_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: cada usuario solo puede leer y actualizar su propio registro
alter table public.users enable row level security;

create policy "users: select own" on public.users
  for select using (auth.uid() = id);

create policy "users: upsert own" on public.users
  for insert with check (auth.uid() = id);

create policy "users: update own" on public.users
  for update using (auth.uid() = id);
