import { supabase } from '@utils/supabase';
import { RivalrySummary, Challenge } from '../models/RivalryModel';

// Helper to check if rivalry tables exist
const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        // PGRST205 means table doesn't exist
        if (error?.code === 'PGRST205') {
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

export const getRivalrySummary = async (userId: string): Promise<RivalrySummary | null> => {
    try {
        const { data, error } = await supabase
            .from('rivalry_summaries')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            // Silently handle missing table
            if (error.code === 'PGRST205') {
                return null;
            }
            console.warn('Error fetching rivalry summary:', error);
            return null;
        }
        return data as RivalrySummary;
    } catch {
        return null;
    }
};

export const getLeaderboard = async (period: 'weekly' | 'monthly' = 'weekly'): Promise<RivalrySummary[]> => {
    try {
        // Calculate dates
        const now = new Date();
        let startDate = new Date();
        if (period === 'weekly') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setDate(now.getDate() - 30);
        }

        // Call RPC for period-based stats
        const { data, error } = await supabase
            .rpc('get_leaderboard_by_date', { start_date: startDate.toISOString() });

        if (error) {
            // Silently handle missing RPC function
            if (error.code === 'PGRST202') {
                return [];
            }
            console.warn('Error fetching leaderboard:', error);
            return [];
        }

        const rawData = data || [];

        // Fetch profiles manually to join data
        const userIds = rawData.map((item: any) => item.user_id);
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
    } catch {
        return [];
    }
};

export const getActiveChallenges = async (userId: string): Promise<Challenge[]> => {
    try {
        const { data: challenges, error } = await supabase
            .from('rivalry_challenges')
            .select('*')
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .eq('status', 'active');

        if (error) {
            // Silently handle missing table
            if (error.code === 'PGRST205') {
                return [];
            }
            console.warn('Error fetching active challenges:', error);
            return [];
        }

        if (!challenges || challenges.length === 0) return [];

        // Fetch relevant profiles manually
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
    } catch {
        return [];
    }
};

export const getOpenLobbies = async (userId: string): Promise<Challenge[]> => {
    try {
        // Get ALL pending challenges from OTHER users that you can join
        // No time filter - show all open lobbies
        
        const { data: challenges, error } = await supabase
            .from('rivalry_challenges')
            .select('*')
            .eq('status', 'pending')
            .is('opponent_id', null)
            .neq('challenger_id', userId) // Not my own
            .order('start_time', { ascending: false }); // Newest first

        console.log('Open lobbies query result:', { challenges, error, userId });

        if (error) {
            if (error.code === 'PGRST205') return [];
            console.warn('Error fetching open lobbies:', error);
            return [];
        }

        if (!challenges || challenges.length === 0) {
            console.log('No open lobbies found');
            return [];
        }
        
        console.log('Found', challenges.length, 'open lobbies');

        // Fetch challenger profiles
        const profileIds = new Set<string>();
        challenges.forEach((c: any) => {
            if (c.challenger_id) profileIds.add(c.challenger_id);
        });

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', Array.from(profileIds));

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        return challenges.map((c: any) => ({
            ...c,
            challenger: profileMap.get(c.challenger_id),
            opponent: null
        }));
    } catch {
        return [];
    }
};

export const joinChallenge = async (challengeId: string, visitorId: string): Promise<Challenge | null> => {
    try {
        console.log('Attempting to join challenge:', challengeId, 'as user:', visitorId);
        
        // First, get the challenge without filters to see its current state
        const { data: allChallenges, error: debugError } = await supabase
            .from('rivalry_challenges')
            .select('*')
            .eq('id', challengeId);
            
        console.log('Challenge current state:', allChallenges?.[0]);
        
        if (allChallenges && allChallenges[0]) {
            const c = allChallenges[0];
            if (c.status !== 'pending') {
                throw new Error(`Challenge status is "${c.status}", not "pending"`);
            }
            if (c.opponent_id !== null) {
                throw new Error('Someone already joined this challenge');
            }
            if (c.challenger_id === visitorId) {
                throw new Error('You cannot join your own challenge');
            }
        } else {
            throw new Error('Challenge not found');
        }

        const challenge = allChallenges[0];

        // Calculate start/end times
        const startTime = new Date().toISOString();
        const endTime = new Date(Date.now() + challenge.duration_hours * 3600 * 1000).toISOString();

        // Update the challenge
        const { data: updatedData, error: joinError } = await supabase
            .from('rivalry_challenges')
            .update({
                opponent_id: visitorId,
                status: 'active',
                start_time: startTime,
                end_time: endTime
            })
            .eq('id', challengeId)
            .select();

        console.log('Join challenge - update result:', { updatedData, joinError });

        if (joinError) {
            console.warn('Error updating challenge:', joinError);
            throw new Error('Failed to join: ' + joinError.message);
        }

        if (!updatedData || updatedData.length === 0) {
            throw new Error('Failed to update challenge');
        }

        return await getChallengeById(updatedData[0].id);
    } catch (e: any) {
        console.warn('Error joining challenge:', e);
        throw e;
    }
};

export const getChallengeHistory = async (userId: string): Promise<Challenge[]> => {
    try {
        const { data: challenges, error } = await supabase
            .from('rivalry_challenges')
            .select('*')
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .in('status', ['finished', 'declined'])
            .order('end_time', { ascending: false });

        if (error) {
            // Silently handle missing table
            if (error.code === 'PGRST205') {
                return [];
            }
            console.warn('Error fetching challenge history:', error);
            return [];
        }

        if (!challenges || challenges.length === 0) return [];

        // Fetch relevant profiles manually
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
    } catch {
        return [];
    }
};

export const getChallengeById = async (challengeId: string): Promise<Challenge | null> => {
    try {
        const { data: challenge, error } = await supabase
            .from('rivalry_challenges')
            .select('*')
            .eq('id', challengeId)
            .single();

        if (error || !challenge) {
            if (error?.code === 'PGRST205') {
                return null;
            }
            console.warn('Error fetching challenge details:', error);
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
    } catch {
        return null;
    }
};

export const findOrCreateQuickMatch = async (
    userId: string,
    type: 'steps' | 'calories' | 'distance' = 'steps',
    target: number = 6000,
    duration: number = 24
): Promise<Challenge & { is_new_created?: boolean }> => {
    // Check if table exists first
    const tableExists = await checkTableExists('rivalry_challenges');
    if (!tableExists) {
        throw new Error('Rivalry feature is not available. Database tables are not set up.');
    }

    // 1. Try to find an open challenge (pending, no opponent, not created by me)
    // Match any pending challenge of the same TYPE (steps/calories/distance)
    // Don't filter by exact target or duration - just find someone to play with!
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: openChallenges, error: searchError } = await supabase
        .from('rivalry_challenges')
        .select('*')
        .eq('status', 'pending')
        .is('opponent_id', null)
        .neq('challenger_id', userId)
        .eq('challenge_type', type)
        .gt('start_time', fifteenMinutesAgo)
        .order('start_time', { ascending: true }) // Oldest first (FIFO)
        .limit(5); // Get a few candidates

    if (searchError) console.warn("Error searching match:", searchError);
    
    console.log("Found open challenges:", openChallenges?.length || 0);

    // DUPLICATE CHECK
    if (openChallenges && openChallenges.length > 0) {
        const candidate = openChallenges[0];

        const { data: myMatchesWithHim } = await supabase
            .from('rivalry_challenges')
            .select('id')
            .or(`and(challenger_id.eq.${userId},opponent_id.eq.${candidate.challenger_id}),and(challenger_id.eq.${candidate.challenger_id},opponent_id.eq.${userId})`)
            .eq('status', 'active')
            .limit(1);

        if (myMatchesWithHim && myMatchesWithHim.length > 0) {
            console.log("Skipping candidate - already have active match with user:", candidate.challenger_id);
            openChallenges.pop();
        }
    }

    if (openChallenges && openChallenges.length > 0) {
        const match = openChallenges[0];
        console.log("Found match, joining:", match.id);

        // SCHEDULING LOGIC
        const { data: myActive } = await supabase
            .from('rivalry_challenges')
            .select('end_time')
            .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
            .eq('status', 'active')
            .order('end_time', { ascending: false })
            .limit(1);

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

        const pendingMax = Math.max(nowTime, myLatest, theirLatest);
        const startTime = new Date(pendingMax + 2000).toISOString();
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

        return await getChallengeById(joinedMatch.id) as Challenge;
    }

    console.log("No match found, creating waiting room...");

    // 2. Create new pending challenge
    const { data: newMatch, error: createError } = await supabase
        .from('rivalry_challenges')
        .insert({
            challenger_id: userId,
            opponent_id: null,
            challenge_type: type,
            target_value: target,
            duration_hours: duration,
            status: 'pending',
            start_time: new Date().toISOString(),
            challenger_progress: 0,
            opponent_progress: 0
        })
        .select()
        .single();

    if (createError) throw createError;

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
            status: 'active',
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

export const surrenderChallenge = async (challengeId: string, visitorId: string) => {
    const { data: challenge, error: fetchError } = await supabase
        .from('rivalry_challenges')
        .select('challenger_id, opponent_id')
        .eq('id', challengeId)
        .single();

    if (fetchError || !challenge) throw new Error('Challenge not found');

    const winnerId = challenge.challenger_id === visitorId ? challenge.opponent_id : challenge.challenger_id;

    if (!winnerId) throw new Error('Opponent not found');

    const { data, error } = await supabase
        .from('rivalry_challenges')
        .update({
            status: 'finished',
            winner_id: winnerId,
            end_time: new Date().toISOString()
        })
        .eq('id', challengeId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateChallengeProgress = async (challengeId: string, visitorId: string, progress: number) => {
    try {
        const { data: challenge, error: fetchError } = await supabase
            .from('rivalry_challenges')
            .select('challenger_id, opponent_id')
            .eq('id', challengeId)
            .single();

        if (fetchError || !challenge) return;

        let updateData = {};
        if (visitorId === challenge.challenger_id) {
            updateData = { challenger_progress: progress };
        } else if (visitorId === challenge.opponent_id) {
            updateData = { opponent_progress: progress };
        } else {
            return;
        }

        const { error } = await supabase
            .from('rivalry_challenges')
            .update(updateData)
            .eq('id', challengeId);

        if (error) console.warn('Error updating progress:', error);
    } catch {
        // Silently fail
    }
};
