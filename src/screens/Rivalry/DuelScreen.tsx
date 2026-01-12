import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Pedometer } from 'expo-sensors';

const { width } = Dimensions.get('window');

export const DuelScreen = ({ route }: any) => {
    const { theme, palette } = useTheme();
    const navigation = useNavigation<any>();
    const { challengeId, isQuickMatch } = route.params || {};

    const [challenge, setChallenge] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [statusText, setStatusText] = React.useState('');
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [localSteps, setLocalSteps] = React.useState<number>(0);

    // Fetch user ID on mount
    React.useEffect(() => {
        const getUser = async () => {
            const { supabase } = require('../../utils/supabase');
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        getUser();
    }, []);

    const fetchChallenge = async (id: string, uid?: string) => {
        try {
            const { getChallengeById } = require('../../api/rivalryService');
            const data = await getChallengeById(id);
            if (data && uid) {
                // Pre-calculate derived data if needed?
                // No, we'll render conditionally.
            }
            setChallenge(data);
            return data;
        } catch (e) {
            console.error(e);
        }
        return null;
    };

    React.useEffect(() => {
        const init = async () => {
            const { findOrCreateQuickMatch } = require('../../api/rivalryService');
            const { supabase } = require('../../utils/supabase');

            // Ensure we have user first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Musisz być zalogowany!');
                navigation.navigate('Challenges');
                return;
            }
            setCurrentUserId(user.id);

            // 1. If Quick Match requested
            if (isQuickMatch && !challengeId) {
                setStatusText('Szukanie rywala...');
                try {
                    const match = await findOrCreateQuickMatch(user.id);
                    setChallenge(match);
                } catch (e) {
                    console.error(e);
                    alert('Błąd podczas szukania pojedynku');
                } finally {
                    setLoading(false);
                }
            }
            // 2. If viewing specific challenge
            else if (challengeId) {
                setStatusText('Ładowanie...');
                await fetchChallenge(challengeId, user.id);
                setLoading(false);
            }
        };

        init();
    }, [challengeId, isQuickMatch]);

    // SIMPLIFIED Step Tracking: Use ONLY getStepCountAsync
    // This gives us authoritative step count from challenge start to now
    // No refs, no watchStepCount, no manual reset handling needed

    React.useEffect(() => {
        if (!challenge) return;
        if (challenge.status !== 'active' || challenge.challenge_type !== 'steps') return;

        const startTime = new Date(challenge.start_time);
        const now = new Date();

        // Don't start tracking until challenge has started
        if (now < startTime) return;

        let isActive = true;

        // Poll for steps every 3 seconds
        const interval = setInterval(async () => {
            if (!isActive) return;

            try {
                // Fetch latest challenge data
                const updated = await fetchChallenge(challenge.id);
                if (!updated) return;

                // Request permissions if needed
                const { granted } = await Pedometer.requestPermissionsAsync();
                if (!granted) return;

                // Check if pedometer is available
                const available = await Pedometer.isAvailableAsync();
                if (!available) return;

                // Get steps from challenge start to now
                // This is the TOTAL steps walked in this challenge
                const currentTime = new Date();
                const result = await Pedometer.getStepCountAsync(startTime, currentTime);
                const totalSteps = result.steps;

                console.log(`Steps from ${startTime.toISOString()} to ${currentTime.toISOString()}: ${totalSteps}`);

                // Update local display
                setLocalSteps(totalSteps);

                // Push to server if increased
                if (currentUserId && totalSteps > 0) {
                    const myProg = updated.challenger_id === currentUserId
                        ? updated.challenger_progress
                        : updated.opponent_progress;

                    if (totalSteps > (myProg || 0)) {
                        const { updateChallengeProgress } = require('../../api/rivalryService');
                        await updateChallengeProgress(challenge.id, currentUserId, totalSteps);
                        console.log(`Updated progress to ${totalSteps}`);
                    }
                }

                // Stop if challenge finished
                if (updated.status === 'finished') {
                    clearInterval(interval);
                    isActive = false;
                }

            } catch (error) {
                console.warn('Step tracking error:', error);
            }
        }, 3000);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [challenge?.id, challenge?.status, challenge?.start_time, currentUserId]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: palette.text, marginBottom: 10 }}>{statusText}</Text>
                {/* ActivityIndicator could go here */}
            </SafeAreaView>
        );
    }

    if (!challenge) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: palette.text }}>Nie udało się załadować pojedynku.</Text>
            </SafeAreaView>
        );
    }

    const isPending = challenge.status === 'pending';

    // Determine WHO IS WHO
    // If I am challenger -> Me = challenger, Them = opponent
    // If I am opponent -> Me = opponent, Them = challenger
    const isChallenger = currentUserId === challenge.challenger_id;

    const myProfile = isChallenger ? challenge.challenger : challenge.opponent;
    const opponentProfile = isChallenger ? challenge.opponent : challenge.challenger;

    const myProgress = isChallenger ? challenge.challenger_progress : challenge.opponent_progress;
    const opponentProgress = isChallenger ? challenge.opponent_progress : challenge.challenger_progress;

    const now = new Date();
    const startTime = new Date(challenge.start_time);
    const isScheduled = challenge.status === 'active' && startTime > now;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.navigate('Challenges')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>
                    {isPending ? 'Lobby' : (isScheduled ? 'Oczekiwanie na start' : 'Pojedynek')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* VS Header */}
                <View style={styles.vsContainer}>
                    {/* ME (Always Left) */}
                    <View style={styles.playerContainer}>
                        <View style={[styles.avatarBig, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.avatarText}>
                                {myProfile?.full_name?.charAt(0) || 'JA'}
                            </Text>
                        </View>
                        <Text style={[styles.playerName, { color: palette.text }]}>
                            {myProfile?.full_name || 'Ty'}
                        </Text>
                    </View>

                    <View style={styles.vsBadge}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>

                    {/* THEM (Always Right) */}
                    <View style={styles.playerContainer}>
                        <View style={[styles.avatarBig, { backgroundColor: isPending ? '#ccc' : theme.colors.danger }]}>
                            <Text style={styles.avatarText}>
                                {isPending ? '?' : (opponentProfile?.full_name?.charAt(0) || 'ON')}
                            </Text>
                        </View>
                        <Text style={[styles.playerName, { color: palette.text }]}>
                            {isPending ? 'Szukanie...' : (opponentProfile?.full_name || 'Rywal')}
                        </Text>
                    </View>
                </View>

                {/* Score Board */}
                <LinearGradient
                    colors={['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.05)']}
                    style={[styles.scoreBoard, { borderColor: theme.colors.primary }]}
                >
                    <Text style={[styles.scoreTitle, { color: palette.subText }]}>
                        {isPending ? 'OCZEKIWANIE NA PRZECIWNIKA' : (isScheduled ? 'ZAPLANOWANY' : `WYZWANIE ${challenge.challenge_type.toUpperCase()}`)}
                    </Text>

                    {isPending ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: palette.text, textAlign: 'center', marginBottom: 10 }}>
                                Czekamy na drugiego gracza...
                            </Text>
                            <Text style={{ color: palette.subText, fontSize: 12 }}>
                                ID: {challenge.id.slice(0, 8)}...
                            </Text>
                        </View>
                    ) : isScheduled ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Ionicons name="time" size={48} color={theme.colors.warning} style={{ marginBottom: 16 }} />
                            <Text style={{ color: palette.text, textAlign: 'center', marginBottom: 10, fontWeight: 'bold' }}>
                                Ten pojedynek jest w kolejce.
                            </Text>
                            <Text style={{ color: palette.subText, textAlign: 'center' }}>
                                Gracze muszą dokończyć swoje poprzednie walki.
                            </Text>
                            <Text style={{ color: theme.colors.primary, fontSize: 18, marginTop: 12, fontWeight: 'bold' }}>
                                Start: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.scoreRow}>
                                <Text style={[styles.scoreBig, { color: theme.colors.primary }]}>
                                    {Math.max(myProgress || 0, localSteps)}
                                </Text>
                                <Text style={[styles.scoreDivider, { color: palette.border }]}>-</Text>
                                <Text style={[styles.scoreBig, { color: theme.colors.danger }]}>
                                    {opponentProgress || 0}
                                </Text>
                            </View>
                            <Text style={[styles.timer, { color: palette.text }]}>
                                {challenge.end_time ? `Do: ${new Date(challenge.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </Text>
                        </>
                    )}
                </LinearGradient>

                {/* Detailed Stats */}
                {!isPending && !challenge.winner_id && (
                    <View style={styles.statsContainer}>
                        <Text style={[styles.statsTitle, { color: palette.text }]}>Statystyki</Text>

                        <View style={[styles.statRow, { backgroundColor: palette.card }]}>
                            <Text style={{ color: palette.text, fontWeight: '700' }}>Cel</Text>
                            <View style={styles.statValues}>
                                <Text style={{ color: theme.colors.primary }}>{challenge.target_value}</Text>
                            </View>
                        </View>

                        <Pressable
                            style={{
                                marginTop: 24,
                                backgroundColor: 'transparent',
                                padding: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.danger,
                                alignItems: 'center'
                            }}
                            onPress={async () => {
                                try {
                                    const { surrenderChallenge } = require('../../api/rivalryService');
                                    await surrenderChallenge(challenge.id, currentUserId);
                                    alert('Pojedynek zakończony. Wygrał przeciwnik.');
                                    navigation.navigate('Challenges');
                                } catch (e) {
                                    console.error(e);
                                    alert('Błąd podczas poddawania się');
                                }
                            }}
                        >
                            <Text style={{ color: theme.colors.danger, fontWeight: 'bold' }}>Poddaj się</Text>
                        </Pressable>
                    </View>
                )}

                {/* Show Winner if finished */}
                {challenge.winner_id && (
                    <View style={[styles.statsContainer, { alignItems: 'center', marginTop: 20 }]}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: challenge.winner_id === currentUserId ? theme.colors.primary : theme.colors.danger }}>
                            {challenge.winner_id === currentUserId ? 'WYGRAŁEŚ!' : 'PRZEGRAŁEŚ'}
                        </Text>

                        {/* Motivational section for loser */}
                        {challenge.winner_id !== currentUserId && (
                            <View style={{ alignItems: 'center', marginTop: 16, padding: 16, backgroundColor: palette.card, borderRadius: 16 }}>
                                <Text style={{ color: palette.text, fontStyle: 'italic', textAlign: 'center', marginBottom: 12 }}>
                                    "Porażka to tylko przystanek w drodze do sukcesu. Nie poddawaj się!"
                                </Text>
                                <Pressable
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, padding: 12, borderRadius: 12, gap: 8 }}
                                    onPress={() => (navigation as any).navigate('AI')}
                                >
                                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Zapytaj Trenera jak się poprawić</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    vsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    playerContainer: {
        alignItems: 'center',
        gap: 8,
    },
    avatarBig: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    playerName: {
        fontWeight: '700',
        fontSize: 16,
    },
    vsBadge: {
        backgroundColor: '#000',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    vsText: {
        color: '#fff',
        fontWeight: '900',
        fontStyle: 'italic',
    },
    scoreBoard: {
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 32,
    },
    scoreTitle: {
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 12,
    },
    scoreBig: {
        fontSize: 32,
        fontWeight: '800',
    },
    scoreDivider: {
        fontSize: 32,
        fontWeight: '300',
    },
    timer: {
        fontWeight: '600',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    },
    statsContainer: {
        gap: 12,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
    },
    statValues: {
        flexDirection: 'row',
        gap: 16,
    }
});
