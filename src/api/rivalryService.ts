import { supabase } from '@utils/supabase';
import { RivalrySummary, Challenge } from '../models/RivalryModel';

export const getRivalrySummary = async (userId: string): Promise<RivalrySummary | null> => {
    const { data, error } = await supabase
        .from('rivalry_summaries')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // FIX: maybeSingle prevents error on no rows

    if (error) {
        console.warn('Error fetching rivalry summary:', error);
        return null; // Safe fallback
    }
    return data as RivalrySummary;
};

export const getLeaderboard = async (period: 'weekly' | 'monthly' = 'weekly'): Promise<RivalrySummary[]> => {
    let rawData = [];

    // Calculate dates
    const now = new Date();
    let startDate = new Date();
    if (period === 'weekly') {
        // Last 7 days
        startDate.setDate(now.getDate() - 7);
    } else {
        // Last 30 days
        startDate.setDate(now.getDate() - 30);
    }

    // Call RPC for period-based stats
    const { data, error } = await supabase
        .rpc('get_leaderboard_by_date', { start_date: startDate.toISOString() });

    if (error) {
        console.error('Error fetching leaderboard RPC:', error);
        return [];
    }
    rawData = data || [];

    // 2. Fetch profiles manually to join data (avoid Foreign Key issues)
    const userIds = (rawData || []).map((item: any) => item.user_id);
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .in('id', userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        return rawData.map((item: any) => {
            const profile = profileMap.get(item.user_id);
            return {
                ...item,
                username: profile?.full_name || profile?.username || 'Unknown',
                avatar_url: profile?.avatar_url
            };
        });
    }

    return rawData as RivalrySummary[];
};

export const getActiveChallenges = async (userId: string): Promise<Challenge[]> => {
    // 1. Fetch active challenges
    const { data: challenges, error } = await supabase
        .from('rivalry_challenges')
        .select('*')
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .eq('status', 'active');

    if (error) {
        console.error('Error fetching active challenges:', error);
        return [];
    }

    if (!challenges || challenges.length === 0) return [];

    // 2. Fetch relevant profiles manually
    const profileIds = new Set<string>();
    challenges.forEach((c: any) => {
        if (c.challenger_id) profileIds.add(c.challenger_id);
        if (c.opponent_id) profileIds.add(c.opponent_id);
    });

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(profileIds));

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return challenges.map((c: any) => ({
        ...c,
        challenger: profileMap.get(c.challenger_id),
        opponent: profileMap.get(c.opponent_id)
    }));
};

export const getChallengeHistory = async (userId: string): Promise<Challenge[]> => {
    // 1. Fetch raw history
    const { data: challenges, error } = await supabase
        .from('rivalry_challenges')
        .select('*')
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .in('status', ['finished', 'declined']) // Filter for history
        .order('end_time', { ascending: false });

    if (error) {
        console.error('Error fetching challenge history:', error);
        return [];
    }

    if (!challenges || challenges.length === 0) return [];

    // 2. Fetch relevant profiles manually
    const profileIds = new Set<string>();
    challenges.forEach((c: any) => {
        if (c.challenger_id) profileIds.add(c.challenger_id);
        if (c.opponent_id) profileIds.add(c.opponent_id);
    });

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(profileIds));

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return challenges.map((c: any) => ({
        ...c,
        challenger: profileMap.get(c.challenger_id),
        opponent: profileMap.get(c.opponent_id)
    }));
};

export const getChallengeById = async (challengeId: string): Promise<Challenge | null> => {
    const { data: challenge, error } = await supabase
        .from('rivalry_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

    if (error || !challenge) {
        console.error('Error fetching challenge details:', error);
        return null;
    }

    // Fetch profiles
    const userIds = [challenge.challenger_id, challenge.opponent_id].filter(Boolean);
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return {
        ...challenge,
        challenger: profileMap.get(challenge.challenger_id),
        opponent: profileMap.get(challenge.opponent_id)
    };
};

export const findOrCreateQuickMatch = async (
    userId: string,
    type: 'steps' | 'calories' | 'distance' = 'steps',
    target: number = 6000,
    duration: number = 24
): Promise<Challenge & { is_new_created?: boolean }> => {
    // 1. Try to find an open challenge (pending, no opponent, not created by me)
    // We try to match the same type first
    // FILTER: Only consider matches created in the last 15 minutes to avoid stale ghost lobbies
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: openChallenges, error: searchError } = await supabase
        .from('rivalry_challenges')
        .select('*')
        .eq('status', 'pending')
        .is('opponent_id', null)
        .neq('challenger_id', userId)
        .eq('challenge_type', type)
        .gt('start_time', fifteenMinutesAgo) // Only recent matches
        .limit(1);

    if (searchError) console.error("Error searching match:", searchError);

    // DUPLICATE CHECK: Filter out matches where I already have an active duel with this specific opponent
    // We do this client-side for simplicity as we fetched one candidate
    if (openChallenges && openChallenges.length > 0) {
        const candidate = openChallenges[0];

        // Check if I have an active match with candidate.challenger_id
        const { data: existingDuel } = await supabase
            .from('rivalry_challenges')
            .select('id')
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .or(`challenger_id.eq.${candidate.challenger_id},opponent_id.eq.${candidate.challenger_id}`)
            .eq('status', 'active')
            .limit(1);

        // If existing match found where both are participants, DO NOT JOIN.
        // Wait, the .or logic above is too broad. We need AND logic: (me IN match) AND (him IN match) AND active.

        const { data: myMatchesWithHim } = await supabase
            .from('rivalry_challenges')
            .select('id')
            .or(`and(challenger_id.eq.${userId},opponent_id.eq.${candidate.challenger_id}),and(challenger_id.eq.${candidate.challenger_id},opponent_id.eq.${userId})`)
            .eq('status', 'active')
            .limit(1);

        if (myMatchesWithHim && myMatchesWithHim.length > 0) {
            console.log("Skipping candidate - already have active match with user:", candidate.challenger_id);
            // Cannot join this one.
            // In a recursive solution we would search again excluding this ID. 
            // For MVP, if we find a duplicate, we just fall through to "Create Waiting Room" (Wait for someone else).
            openChallenges.pop(); // Remove it so we don't enter the join block
        }
    }

    if (openChallenges && openChallenges.length > 0) {
        const match = openChallenges[0];
        console.log("Found match, joining:", match.id);

        // --- SCHEDULING LOGIC ---
        // 1. Get my latest active end_time
        const { data: myActive } = await supabase
            .from('rivalry_challenges')
            .select('end_time')
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .eq('status', 'active')
            .order('end_time', { ascending: false })
            .limit(1);

        // 2. Get opponent's latest active end_time
        const opponentId = match.challenger_id;
        const { data: theirActive } = await supabase
            .from('rivalry_challenges')
            .select('end_time')
            .or(`challenger_id.eq.${opponentId},opponent_id.eq.${opponentId}`)
            .eq('status', 'active')
            .order('end_time', { ascending: false })
            .limit(1);

        const myLatest = myActive?.[0]?.end_time ? new Date(myActive[0].end_time).getTime() : 0;
        const theirLatest = theirActive?.[0]?.end_time ? new Date(theirActive[0].end_time).getTime() : 0;
        const nowTime = Date.now();

        // Start time is MAX(now, myLatest, theirLatest) + buffer
        const pendingMax = Math.max(nowTime, myLatest, theirLatest);
        const startTime = new Date(pendingMax + 2000).toISOString(); // +2 sec buffer
        const endTime = new Date(new Date(startTime).getTime() + match.duration_hours * 3600 * 1000).toISOString();

        console.log(`Scheduling match. Start: ${startTime}`);

        const { data: joinedMatch, error: joinError } = await supabase
            .from('rivalry_challenges')
            .update({
                opponent_id: userId,
                status: 'active',
                start_time: startTime,
                end_time: endTime
            })
            .eq('id', match.id)
            .select()
            .single();

        if (joinError) throw joinError;

        // Return full structure with profiles
        return await getChallengeById(joinedMatch.id) as Challenge;
    }

    console.log("No match found, creating waiting room...");

    // 2. Create new pending challenge
    const { data: newMatch, error: createError } = await supabase
        .from('rivalry_challenges')
        .insert({
            challenger_id: userId,
            opponent_id: null, // explicit null
            challenge_type: type,
            target_value: target,
            duration_hours: duration,
            status: 'pending',
            start_time: new Date().toISOString(), // creation time
            // end_time is null until started
            challenger_progress: 0,
            opponent_progress: 0
        })
        .select()
        .single();

    if (createError) throw createError;

    // Return with just challenger profile loaded
    return await getChallengeById(newMatch.id) as Challenge;
};

export const createChallenge = async (
    challengerId: string,
    opponentId: string,
    type: 'steps',
    target: number,
    duration: number
) => {
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + duration * 3600 * 1000).toISOString();

    const { data, error } = await supabase
        .from('rivalry_challenges')
        .insert({
            challenger_id: challengerId,
            opponent_id: opponentId,
            challenge_type: type,
            target_value: target,
            duration_hours: duration,
            status: 'active', // Direct active for MV P
            start_time: startTime,
            end_time: endTime,
            challenger_progress: 0,
            opponent_progress: 0
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const surrenderChallenge = async (challengeId: string, userId: string) => {
    // 1. Get the challenge to identify the opponent
    const { data: challenge, error: fetchError } = await supabase
        .from('rivalry_challenges')
        .select('challenger_id, opponent_id')
        .eq('id', challengeId)
        .single();

    if (fetchError || !challenge) throw new Error('Challenge not found');

    // 2. Determine winner (the other person)
    const winnerId = challenge.challenger_id === userId ? challenge.opponent_id : challenge.challenger_id;

    if (!winnerId) throw new Error('Opponent not found');

    // 3. Update challenge status and winner
    const { data, error } = await supabase
        .from('rivalry_challenges')
        .update({
            status: 'finished',
            winner_id: winnerId,
            end_time: new Date().toISOString() // End immediately
        })
        .eq('id', challengeId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateChallengeProgress = async (challengeId: string, userId: string, progress: number) => {
    // Determine which column to update based on user ID
    // We first need to know if user is challenger or opponent
    const { data: challenge, error: fetchError } = await supabase
        .from('rivalry_challenges')
        .select('challenger_id, opponent_id')
        .eq('id', challengeId)
        .single();

    if (fetchError || !challenge) return;

    let updateData = {};
    if (userId === challenge.challenger_id) {
        updateData = { challenger_progress: progress };
    } else if (userId === challenge.opponent_id) {
        updateData = { opponent_progress: progress };
    } else {
        return; // User not in this challenge
    }

    const { error } = await supabase
        .from('rivalry_challenges')
        .update(updateData)
        .eq('id', challengeId);

    if (error) console.error('Error updating progress:', error);
};
