export type ChallengeStatus = 'pending' | 'active' | 'finished' | 'declined';
export type ChallengeType = 'steps' | 'calories' | 'distance';

export interface RivalrySummary {
    user_id: string;
    points: number;
    wins: number;
    matches_played: number;
    rank_score?: number; // optional if computed
    username?: string;   // Joined from profiles
    avatar_url?: string; // Joined from profiles
}

export interface Challenge {
    id: string;
    challenger_id: string;
    opponent_id: string;
    challenge_type: ChallengeType;
    target_value: number;
    duration_hours: number;
    status: ChallengeStatus;
    start_time: string;
    end_time: string;
    winner_id?: string;
    challenger_progress: number;
    opponent_progress: number;

    // Joined fields for display
    challenger?: { full_name: string; avatar_url: string; };   // Joined from profiles
    opponent?: { full_name: string; avatar_url: string; };     // Joined from profiles
}
