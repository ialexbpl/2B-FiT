-- RPC function to get leaderboard stats dynamically based on date range
-- Helper for Weekly / Monthly views
create or replace function get_leaderboard_by_date(start_date timestamptz)
returns table (
  user_id uuid,
  points bigint,
  wins bigint,
  matches_played bigint,
  rank_score float
)
security definer
language sql
as $$
  with participation as (
    -- Winner records (10 points)
    select 
      winner_id as uid,
      10 as pts,
      1 as w,
      1 as m
    from rivalry_challenges
    where status = 'finished' and end_time >= start_date
    
    union all
    
    -- Loser records (2 points)
    select 
      (case when challenger_id = winner_id then opponent_id else challenger_id end) as uid,
      2 as pts,
      0 as w,
      1 as m
    from rivalry_challenges
    where status = 'finished' and end_time >= start_date
  )
  select 
    uid as user_id,
    coalesce(sum(pts), 0)::bigint as points,
    coalesce(sum(w), 0)::bigint as wins,
    coalesce(sum(m), 0)::bigint as matches_played,
    coalesce(sum(pts), 0)::float as rank_score
  from participation
  where uid is not null
  group by uid
  order by points desc
  limit 50;
$$;
