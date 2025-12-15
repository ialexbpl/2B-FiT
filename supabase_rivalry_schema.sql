-- Skopiuj CAŁOŚĆ i wklej do Supabase -> SQL Editor -> New Query
-- Następnie kliknij "RUN"

-- 1. Tabela podsumowań (rankingi)
create table if not exists rivalry_summaries (
  user_id uuid references auth.users not null primary key,
  points int default 0,
  wins int default 0,
  matches_played int default 0,
  rank_score float default 0
);

-- 2. Tabela wyzwań
create table if not exists rivalry_challenges (
  id uuid default gen_random_uuid() primary key,
  challenger_id uuid references auth.users not null,
  opponent_id uuid references auth.users not null,
  challenge_type text not null, -- 'steps', 'calories', 'distance'
  target_value int not null,
  duration_hours int not null,
  status text default 'active', -- 'pending', 'active', 'finished'
  start_time timestamptz default now(),
  end_time timestamptz,
  challenger_progress int default 0,
  opponent_progress int default 0,
  winner_id uuid references auth.users
);

-- 3. (OPCJONALNE) Włączenie RLS (Row Level Security) - ZABEZPIECZENIA
-- Jeśli to pominiesz, baza może być publicznie dostępna w zależności od ustawień projektu.
-- Zalecane jest włączenie:

alter table rivalry_summaries enable row level security;
alter table rivalry_challenges enable row level security;

-- Polityki dostępu (każdy widzi ranking, ale edycja tylko swoje?)
create policy "Public read summaries" on rivalry_summaries for select using (true);
create policy "User update own summary" on rivalry_summaries for update using (auth.uid() = user_id);
create policy "User insert own summary" on rivalry_summaries for insert with check (auth.uid() = user_id);

create policy "Users can see challenges they are involved in" on rivalry_challenges
    for select using (auth.uid() = challenger_id or auth.uid() = opponent_id);
create policy "Users can create challenges" on rivalry_challenges
    for insert with check (auth.uid() = challenger_id);
create policy "Users can update challenges they are involved in" on rivalry_challenges
    for update using (auth.uid() = challenger_id or auth.uid() = opponent_id);
