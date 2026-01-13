import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { supabase } from '@utils/supabase';
import { useAuth } from '@context/AuthContext';

/**
 * Hook to listen for rivalry challenge updates and send local notifications
 * - Notifies when someone joins your pending challenge
 * - Notifies when a challenge ends and winner is determined
 */
export const useRivalryNotifications = () => {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const notifiedChallengesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!userId) return;

        // Subscribe to changes on rivalry_challenges table
        const channel = supabase
            .channel('rivalry-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rivalry_challenges',
                    filter: `challenger_id=eq.${userId}`,
                },
                async (payload) => {
                    const oldRecord = payload.old as any;
                    const newRecord = payload.new as any;

                    // Someone joined my pending challenge
                    if (oldRecord.status === 'pending' && newRecord.status === 'active' && newRecord.opponent_id) {
                        const notifKey = `joined-${newRecord.id}`;
                        if (notifiedChallengesRef.current.has(notifKey)) return;
                        notifiedChallengesRef.current.add(notifKey);

                        // Get opponent name
                        const { data: opponent } = await supabase
                            .from('profiles')
                            .select('full_name, username')
                            .eq('id', newRecord.opponent_id)
                            .single();

                        const opponentName = opponent?.full_name || opponent?.username || 'Someone';

                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: '⚔️ Duel Started!',
                                body: `${opponentName} joined your challenge. Game on!`,
                                data: { type: 'duel-started', challengeId: newRecord.id },
                            },
                            trigger: null, // Immediate
                        });
                    }

                    // Challenge finished - I won
                    if (oldRecord.status === 'active' && newRecord.status === 'finished' && newRecord.winner_id === userId) {
                        const notifKey = `won-${newRecord.id}`;
                        if (notifiedChallengesRef.current.has(notifKey)) return;
                        notifiedChallengesRef.current.add(notifKey);

                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: '🏆 Victory!',
                                body: 'You won the duel! Great job!',
                                data: { type: 'duel-won', challengeId: newRecord.id },
                            },
                            trigger: null,
                        });
                    }

                    // Challenge finished - I lost
                    if (oldRecord.status === 'active' && newRecord.status === 'finished' && newRecord.winner_id && newRecord.winner_id !== userId) {
                        const notifKey = `lost-${newRecord.id}`;
                        if (notifiedChallengesRef.current.has(notifKey)) return;
                        notifiedChallengesRef.current.add(notifKey);

                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: '😔 Duel Ended',
                                body: 'You lost this round. Try again!',
                                data: { type: 'duel-lost', challengeId: newRecord.id },
                            },
                            trigger: null,
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rivalry_challenges',
                    filter: `opponent_id=eq.${userId}`,
                },
                async (payload) => {
                    const oldRecord = payload.old as any;
                    const newRecord = payload.new as any;

                    // Challenge finished - I won (as opponent)
                    if (oldRecord.status === 'active' && newRecord.status === 'finished' && newRecord.winner_id === userId) {
                        const notifKey = `won-${newRecord.id}`;
                        if (notifiedChallengesRef.current.has(notifKey)) return;
                        notifiedChallengesRef.current.add(notifKey);

                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: '🏆 Victory!',
                                body: 'You won the duel! Great job!',
                                data: { type: 'duel-won', challengeId: newRecord.id },
                            },
                            trigger: null,
                        });
                    }

                    // Challenge finished - I lost (as opponent)
                    if (oldRecord.status === 'active' && newRecord.status === 'finished' && newRecord.winner_id && newRecord.winner_id !== userId) {
                        const notifKey = `lost-${newRecord.id}`;
                        if (notifiedChallengesRef.current.has(notifKey)) return;
                        notifiedChallengesRef.current.add(notifKey);

                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: '😔 Duel Ended',
                                body: 'You lost this round. Try again!',
                                data: { type: 'duel-lost', challengeId: newRecord.id },
                            },
                            trigger: null,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);
};

/**
 * Send a local notification (can be called from anywhere)
 */
export const sendDuelNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
            },
            trigger: null,
        });
    } catch (e) {
        console.warn('Failed to send duel notification:', e);
    }
};

