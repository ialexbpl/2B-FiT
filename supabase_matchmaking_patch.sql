-- Skopiuj i uruchom w Supabase SQL Editor

-- 1. Pozwól, aby opponent_id był PUSTY (na czas oczekiwania w lobby)
alter table rivalry_challenges alter column opponent_id drop not null;

-- 2. Upewnij się, że statusy obejmują 'pending'
alter table rivalry_challenges drop constraint if exists rivalry_challenges_status_check;
-- (Opcjonalnie można dodać check, ale tekst jest elastyczny. Ważne, żeby logika aplikacji używała 'pending')

-- 3. (Opcjonalnie) Indeks dla szybszego wyszukiwania otwartych wyzwań
create index if not exists idx_rivalry_pending on rivalry_challenges (status) where status = 'pending';
