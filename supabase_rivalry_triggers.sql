-- Trigger function to update stats when a challenge is finished
create or replace function handle_challenge_finished()
returns trigger
security definer
as $$
begin
  -- Only run if status changed to 'finished' and we have a winner
  if new.status = 'finished' and new.winner_id is not null then
  
    -- 1. Update Winner Stats
    insert into rivalry_summaries (user_id, points, wins, matches_played)
    values (new.winner_id, 10, 1, 1)
    on conflict (user_id) do update
    set points = rivalry_summaries.points + 10,
        wins = rivalry_summaries.wins + 1,
        matches_played = rivalry_summaries.matches_played + 1;

    -- 2. Update Loser Stats (Participant)
    -- Loser is the one who is NOT the winner
    declare
      loser_uuid uuid;
    begin
        if new.winner_id = new.challenger_id then
            loser_uuid := new.opponent_id;
        else
            loser_uuid := new.challenger_id;
        end if;

        if loser_uuid is not null then
            insert into rivalry_summaries (user_id, points, wins, matches_played)
            values (loser_uuid, 2, 0, 1)
            on conflict (user_id) do update
            set points = rivalry_summaries.points + 2,
                matches_played = rivalry_summaries.matches_played + 1;
        end if;
    end;
    
  end if;
  return new;
end;
$$ language plpgsql;

-- Drop trigger if exists
drop trigger if exists on_challenge_finished on rivalry_challenges;

-- Create trigger
create trigger on_challenge_finished
after update on rivalry_challenges
for each row
execute function handle_challenge_finished();
