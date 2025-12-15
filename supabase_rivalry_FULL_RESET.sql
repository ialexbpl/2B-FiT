-- UWAGA: To usunie wszystkie dotychczasowe dane z tych dwóch tabel!
-- Uruchom w Supabase SQL Editor.

-- 1. Usunięcie starych tabel
drop table if exists rivalry_challenges;
drop table if exists rivalry_summaries;

-- 2. Tabela podsumowań (rankingi) - tworzymy od nowa
create table rivalry_summaries (
  user_id uuid references auth.users not null primary key,
  points int default 0,
  wins int default 0,
  matches_played int default 0,
  rank_score float default 0
);

-- 3. Tabela wyzwań - WERSJA POPRAWIONA (opponent_id może być pusty)
create table rivalry_challenges (
  id uuid default gen_random_uuid() primary key,
  challenger_id uuid references auth.users not null,
  opponent_id uuid references auth.users, -- ZMIANA: brak "not null", może być pusty (oczekiwanie)
  challenge_type text not null, -- 'steps', 'calories', 'distance'
  target_value int not null,
  duration_hours int not null,
  status text default 'pending', -- ZMIANA: domyślnie 'pending' (oczekiwanie)
  start_time timestamptz default now(),
  end_time timestamptz,
  challenger_progress int default 0,
  opponent_progress int default 0,
  winner_id uuid references auth.users
);

-- 4. Zabezpieczenia (Row Level Security)
alter table rivalry_summaries enable row level security;
alter table rivalry_challenges enable row level security;

-- Polityki dostępu
create policy "Public read summaries" on rivalry_summaries for select using (true);
create policy "User update own summary" on rivalry_summaries for update using (auth.uid() = user_id);
create policy "User insert own summary" on rivalry_summaries for insert with check (auth.uid() = user_id);

-- Polityki dla wyzwań (Lobby)
-- Każdy zalogowany może widzieć wyzwania 'pending' z pustym opponent_id (żeby móc dołączyć)
create policy "See open challenges" on rivalry_challenges for select using (
    (auth.uid() = challenger_id) or 
    (auth.uid() = opponent_id) or 
    (status = 'pending' and opponent_id is null)
);

create policy "Create challenge" on rivalry_challenges for insert with check (auth.uid() = challenger_id);

-- Aktualizacja: można dołączyć do wyzwania (zostać opponentem)
create policy "Join challenge" on rivalry_challenges for update using (
    (auth.uid() = challenger_id) or 
    (status = 'pending' and opponent_id is null) or
    (auth.uid() = opponent_id)
);
