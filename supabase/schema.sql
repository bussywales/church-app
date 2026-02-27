create type public.app_role as enum ('MEMBER', 'ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD', 'FINANCE');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
