-- LoveApp — Supabase SQL Editor'da bir kez çalıştır.

create table if not exists public.date_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  said_yes boolean,
  no_button_attempts integer default 0,
  picked_date text,
  picked_time text,
  food_choice text,
  walk_yes boolean,
  walk_lazy_dismissed boolean default false,
  beer_choice text,
  completed boolean default false,
  user_agent text
);

create index if not exists date_responses_created_at_idx
  on public.date_responses (created_at desc);

alter table public.date_responses enable row level security;

drop policy if exists "anon_insert_responses" on public.date_responses;
create policy "anon_insert_responses"
  on public.date_responses
  for insert
  to anon
  with check (true);

drop policy if exists "anon_update_responses" on public.date_responses;
create policy "anon_update_responses"
  on public.date_responses
  for update
  to anon
  using (true)
  with check (true);

-- anon SELECT kapalı — cevapları Supabase Table Editor'dan oku.
