create extension if not exists pgcrypto;

create table if not exists public.restaurant_proposals (
  id uuid primary key default gen_random_uuid(),
  restaurant jsonb not null check (jsonb_typeof(restaurant) = 'object'),
  design jsonb not null check (jsonb_typeof(design) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.restaurant_proposals enable row level security;
revoke all on table public.restaurant_proposals from anon, authenticated;
grant all on table public.restaurant_proposals to service_role;