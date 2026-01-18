import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { getStepsForRange } from '@hooks/useSteps';

const DURATION_OPTIONS = [
    { label: '1 Hour', value: 1 },
    { label: '2 Hours', value: 2 },
    { label: '6 Hours', value: 6 },
    { label: '12 Hours', value: 12 },
    { label: '24 Hours', value: 24 },
];

const TARGET_OPTIONS = [
    { label: '1,000 steps', value: 1000 },
    { label: '3,000 steps', value: 3000 },
    { label: '5,000 steps', value: 5000 },
    { label: '6,000 steps', value: 6000 },
    { label: '10,000 steps', value: 10000 },
];

export const DuelScreen = ({ route }: any) => {
    const { theme, palette } = useTheme();
    const navigation = useNavigation<any>();
    const { challengeId, isQuickMatch } = route.params || {};

    const [challenge, setChallenge] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(false);
    const [searching, setSearching] = React.useState(false);
    const [statusText, setStatusText] = React.useState('');
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [localSteps, setLocalSteps] = React.useState<number>(0);
    const [error, setError] = React.useState<string | null>(null);

    // Configuration state
    const [showConfig, setShowConfig] = React.useState(isQuickMatch && !challengeId);
    const [selectedDuration, setSelectedDuration] = React.useState(24);
    const [selectedTarget, setSelectedTarget] = React.useState(6000);

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

    const fetchChallenge = async (id: string) => {
        try {
            const { getChallengeById } = require('../../api/rivalryService');
            const data = await getChallengeById(id);
            setChallenge(data);
            return data;
        } catch (e) {
            console.warn(e);
        }
        return null;
    };

    const startQuickMatch = async () => {
        setShowConfig(false);
        setSearching(true);
        setStatusText('Finding opponent...');

        try {
            const { findOrCreateQuickMatch } = require('../../api/rivalryService');
            const { supabase } = require('../../utils/supabase');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'You must be logged in!');
                navigation.navigate('Challenges');
                return;
            }

            const match = await findOrCreateQuickMatch(user.id, 'steps', selectedTarget, selectedDuration);
            setChallenge(match);
        } catch (e: any) {
            console.warn(e);
            setError(e.message || 'Failed to find a match');
        } finally {
            setSearching(false);
        }
    };

    React.useEffect(() => {
        const init = async () => {
            // If viewing existing challenge, load it
            if (challengeId) {
                setLoading(true);
                setStatusText('Loading...');
                await fetchChallenge(challengeId);
                setLoading(false);
            }
        };

        init();
    }, [challengeId]);

    // Step tracking
    React.useEffect(() => {
        if (!challenge) return;
        if (challenge.status !== 'active' || challenge.challenge_type !== 'steps') return;

        const startTime = new Date(challenge.start_time);
        const now = new Date();

        if (now < startTime) return;

        let isActive = true;

        const interval = setInterval(async () => {
            if (!isActive) return;

            try {
                const updated = await fetchChallenge(challenge.id);
                if (!updated) return;

                const currentTime = new Date();
                const result = await getStepsForRange(startTime, currentTime);
                if (result.source === 'unavailable') return;
                const totalSteps = result.steps;

                setLocalSteps(totalSteps);

                if (currentUserId && totalSteps > 0) {
                    const myProg = updated.challenger_id === currentUserId
                        ? updated.challenger_progress
                        : updated.opponent_progress;

                    if (totalSteps > (myProg || 0)) {
                        const { updateChallengeProgress } = require('../../api/rivalryService');
                        await updateChallengeProgress(challenge.id, currentUserId, totalSteps);
                    }
                }

                if (updated.status === 'finished') {
                    clearInterval(interval);
                    isActive = false;
                }

            } catch (err) {
                console.warn('Step tracking error:', err);
            }
        }, 3000);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, [challenge?.id, challenge?.status, challenge?.start_time, currentUserId]);

    // Configuration Screen
    if (showConfig) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                    <Pressable onPress={() => navigation.navigate('Rivalry')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={palette.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: palette.text }]}>Quick Match</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.configContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.configSection}>
                        <Text style={[styles.configLabel, { color: palette.text }]}>Duration</Text>
                        <Text style={[styles.configHint, { color: palette.subText }]}>How long will the duel last?</Text>
                        <View style={styles.optionsGrid}>
                            {DURATION_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.value}
                                    style={[
                                        styles.optionCard,
                                        { 
                                            backgroundColor: selectedDuration === option.value ? theme.colors.primary : palette.card,
                                            borderColor: selectedDuration === option.value ? theme.colors.primary : palette.border
                                        }
                                    ]}
                                    onPress={() => setSelectedDuration(option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        { color: selectedDuration === option.value ? '#fff' : palette.text }
                                    ]}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.configSection}>
                        <Text style={[styles.configLabel, { color: palette.text }]}>Step Goal</Text>
                        <Text style={[styles.configHint, { color: palette.subText }]}>Target steps to win</Text>
                        <View style={styles.optionsGrid}>
                            {TARGET_OPTIONS.map((option) => (
                                <Pressable
                                    key={option.value}
                                    style={[
                                        styles.optionCard,
                                        { 
                                            backgroundColor: selectedTarget === option.value ? theme.colors.primary : palette.card,
                                            borderColor: selectedTarget === option.value ? theme.colors.primary : palette.border
                                        }
                                    ]}
                                    onPress={() => setSelectedTarget(option.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        { color: selectedTarget === option.value ? '#fff' : palette.text }
                                    ]}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <Text style={[styles.summaryTitle, { color: palette.text }]}>Match Summary</Text>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: palette.subText }]}>Type</Text>
                            <Text style={[styles.summaryValue, { color: palette.text }]}>Steps Challenge</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: palette.subText }]}>Duration</Text>
                            <Text style={[styles.summaryValue, { color: palette.text }]}>{selectedDuration} hour{selectedDuration !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: palette.subText }]}>Goal</Text>
                            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{selectedTarget.toLocaleString()} steps</Text>
                        </View>
                    </View>

                    <Pressable
                        style={[styles.startButton, { backgroundColor: theme.colors.primary }]}
                        onPress={startQuickMatch}
                    >
                        <Ionicons name="flash" size={22} color="#fff" />
                        <Text style={styles.startButtonText}>Find Opponent</Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (loading || searching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                    <Pressable onPress={() => navigation.navigate('Rivalry')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={palette.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: palette.text }]}>Duel</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: palette.text }]}>{statusText}</Text>
                    <Text style={[styles.loadingSubtext, { color: palette.subText }]}>
                        This may take a moment...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                    <Pressable onPress={() => navigation.navigate('Rivalry')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={palette.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: palette.text }]}>Duel</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <View style={[styles.errorIcon, { backgroundColor: theme.colors.danger + '15' }]}>
                        <Ionicons name="alert-circle" size={56} color={theme.colors.danger} />
                    </View>
                    <Text style={[styles.errorTitle, { color: palette.text }]}>Oops!</Text>
                    <Text style={[styles.errorText, { color: palette.subText }]}>{error}</Text>
                    <Pressable
                        style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('Rivalry')}
                    >
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    if (!challenge) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                    <Pressable onPress={() => navigation.navigate('Rivalry')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={palette.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: palette.text }]}>Duel</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="help-circle-outline" size={64} color={palette.subText} />
                    <Text style={[styles.errorText, { color: palette.subText, marginTop: 16 }]}>
                        Could not load the duel.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const isPending = challenge.status === 'pending';
    const isChallenger = currentUserId === challenge.challenger_id;

    const myProfile = isChallenger ? challenge.challenger : challenge.opponent;
    const opponentProfile = isChallenger ? challenge.opponent : challenge.challenger;

    const myProgress = isChallenger ? challenge.challenger_progress : challenge.opponent_progress;
    const opponentProgress = isChallenger ? challenge.opponent_progress : challenge.challenger_progress;

    const now = new Date();
    const startTime = new Date(challenge.start_time);
    const isScheduled = challenge.status === 'active' && startTime > now;

    const getHeaderTitle = () => {
        if (isPending) return 'Lobby';
        if (isScheduled) return 'Scheduled';
        return 'Duel';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Fixed Header */}
            <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                <Pressable onPress={() => navigation.navigate('Challenges')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>{getHeaderTitle()}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* VS Header */}
                <View style={styles.vsContainer}>
                    {/* Me (Left) */}
                    <View style={styles.playerContainer}>
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.primary + 'CC']}
                            style={styles.avatarBig}
                        >
                            <Text style={styles.avatarText}>
                                {myProfile?.full_name?.charAt(0)?.toUpperCase() || 'Y'}
                            </Text>
                        </LinearGradient>
                        <Text style={[styles.playerName, { color: palette.text }]} numberOfLines={1}>
                            {myProfile?.full_name || 'You'}
                        </Text>
                        <Text style={[styles.playerLabel, { color: theme.colors.primary }]}>You</Text>
                    </View>

                    <View style={styles.vsBadge}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>

                    {/* Opponent (Right) */}
                    <View style={styles.playerContainer}>
                        <LinearGradient
                            colors={isPending 
                                ? [palette.border, palette.border] 
                                : [theme.colors.danger, theme.colors.danger + 'CC']
                            }
                            style={styles.avatarBig}
                        >
                            <Text style={styles.avatarText}>
                                {isPending ? '?' : (opponentProfile?.full_name?.charAt(0)?.toUpperCase() || 'O')}
                            </Text>
                        </LinearGradient>
                        <Text style={[styles.playerName, { color: palette.text }]} numberOfLines={1}>
                            {isPending ? 'Searching...' : (opponentProfile?.full_name || 'Opponent')}
                        </Text>
                        <Text style={[styles.playerLabel, { color: theme.colors.danger }]}>
                            {isPending ? '' : 'Rival'}
                        </Text>
                    </View>
                </View>

                {/* Score Board */}
                <View style={[styles.scoreBoard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                    {isPending ? (
                        <View style={styles.pendingContent}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={[styles.pendingTitle, { color: palette.text }]}>
                                Waiting for Opponent
                            </Text>
                            <Text style={[styles.pendingSubtext, { color: palette.subText }]}>
                                Someone will join soon...
                            </Text>
                            <View style={[styles.matchIdBadge, { backgroundColor: palette.border }]}>
                                <Text style={[styles.matchIdText, { color: palette.subText }]}>
                                    Match ID: {challenge.id.slice(0, 8)}...
                                </Text>
                            </View>
                        </View>
                    ) : isScheduled ? (
                        <View style={styles.scheduledContent}>
                            <View style={[styles.scheduledIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                                <Ionicons name="time" size={40} color={theme.colors.warning} />
                            </View>
                            <Text style={[styles.scheduledTitle, { color: palette.text }]}>
                                Queued Match
                            </Text>
                            <Text style={[styles.scheduledSubtext, { color: palette.subText }]}>
                                Players must finish current duels first.
                            </Text>
                            <View style={[styles.startTimeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                                <Ionicons name="play-circle" size={18} color={theme.colors.primary} />
                                <Text style={[styles.startTimeText, { color: theme.colors.primary }]}>
                                    Starts at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.activeContent}>
                            <Text style={[styles.challengeLabel, { color: palette.subText }]}>
                                {challenge.challenge_type.toUpperCase()} CHALLENGE
                            </Text>
                            <View style={styles.scoreRow}>
                                <View style={styles.scoreBlock}>
                                    <Text style={[styles.scoreBig, { color: theme.colors.primary }]}>
                                        {Math.max(myProgress || 0, localSteps).toLocaleString()}
                                    </Text>
                                    <Text style={[styles.scorePlayerLabel, { color: palette.subText }]}>You</Text>
                                </View>
                                <View style={styles.scoreDivider}>
                                    <Text style={[styles.dividerText, { color: palette.border }]}>—</Text>
                                </View>
                                <View style={styles.scoreBlock}>
                                    <Text style={[styles.scoreBig, { color: theme.colors.danger }]}>
                                        {(opponentProgress || 0).toLocaleString()}
                                    </Text>
                                    <Text style={[styles.scorePlayerLabel, { color: palette.subText }]}>Rival</Text>
                                </View>
                            </View>
                            {challenge.end_time && (
                                <View style={[styles.timerBadge, { backgroundColor: palette.border }]}>
                                    <Ionicons name="timer-outline" size={14} color={palette.subText} />
                                    <Text style={[styles.timerText, { color: palette.text }]}>
                                        Ends at {new Date(challenge.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Stats Section */}
                {!isPending && !isScheduled && !challenge.winner_id && (
                    <View style={styles.statsSection}>
                        <Text style={[styles.statsTitle, { color: palette.text }]}>Challenge Details</Text>
                        
                        <View style={[styles.statRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                            <View style={styles.statLeft}>
                                <Ionicons name="flag" size={18} color={theme.colors.primary} />
                                <Text style={[styles.statLabel, { color: palette.text }]}>Goal</Text>
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                                {challenge.target_value?.toLocaleString()}
                            </Text>
                        </View>

                        <View style={[styles.statRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                            <View style={styles.statLeft}>
                                <Ionicons name="time" size={18} color={palette.subText} />
                                <Text style={[styles.statLabel, { color: palette.text }]}>Duration</Text>
                            </View>
                            <Text style={[styles.statValue, { color: palette.text }]}>
                                {challenge.duration_hours}h
                            </Text>
                        </View>

                        <Pressable
                            style={[styles.surrenderButton, { borderColor: theme.colors.danger }]}
                            onPress={() => {
                                Alert.alert(
                                    'Surrender',
                                    'Are you sure you want to give up? Your opponent will win.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Surrender',
                                            style: 'destructive',
                                            onPress: async () => {
                                                try {
                                                    const { surrenderChallenge } = require('../../api/rivalryService');
                                                    await surrenderChallenge(challenge.id, currentUserId);
                                                    Alert.alert('Match Over', 'You surrendered. Your opponent wins.');
                                                    navigation.navigate('Challenges');
                                                } catch (e) {
                                                    console.warn(e);
                                                    Alert.alert('Error', 'Failed to surrender');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="flag-outline" size={18} color={theme.colors.danger} />
                            <Text style={[styles.surrenderText, { color: theme.colors.danger }]}>Surrender</Text>
                        </Pressable>
                    </View>
                )}

                {/* Winner Section */}
                {challenge.winner_id && (
                    <View style={styles.resultSection}>
                        <LinearGradient
                            colors={challenge.winner_id === currentUserId 
                                ? [theme.colors.primary + '20', theme.colors.primary + '05']
                                : [theme.colors.danger + '20', theme.colors.danger + '05']
                            }
                            style={[styles.resultCard, { borderColor: challenge.winner_id === currentUserId ? theme.colors.primary : theme.colors.danger }]}
                        >
                            <Ionicons 
                                name={challenge.winner_id === currentUserId ? 'trophy' : 'sad-outline'} 
                                size={56} 
                                color={challenge.winner_id === currentUserId ? '#FFD700' : theme.colors.danger} 
                            />
                            <Text style={[
                                styles.resultTitle, 
                                { color: challenge.winner_id === currentUserId ? theme.colors.primary : theme.colors.danger }
                            ]}>
                                {challenge.winner_id === currentUserId ? 'Victory!' : 'Defeat'}
                            </Text>
                            <Text style={[styles.resultSubtext, { color: palette.subText }]}>
                                {challenge.winner_id === currentUserId 
                                    ? 'Great job! Keep up the momentum!' 
                                    : "Don't give up! Try again!"}
                            </Text>
                        </LinearGradient>

                        {challenge.winner_id !== currentUserId && (
                            <Pressable
                                style={[styles.coachButton, { backgroundColor: theme.colors.primary }]}
                                onPress={() => navigation.navigate('AI')}
                            >
                                <Ionicons name="chatbubbles" size={20} color="#fff" />
                                <Text style={styles.coachButtonText}>Ask Coach for Tips</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={[styles.rematchButton, { borderColor: theme.colors.primary }]}
                            onPress={() => {
                                setShowConfig(true);
                                setChallenge(null);
                                setError(null);
                            }}
                        >
                            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                            <Text style={[styles.rematchText, { color: theme.colors.primary }]}>Quick Rematch</Text>
                        </Pressable>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    // Config Screen Styles
    configContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 30,
    },
    configSection: {
        marginBottom: 20,
    },
    configLabel: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    configHint: {
        fontSize: 13,
        marginBottom: 12,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionCard: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        minWidth: '30%',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    summaryCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 10,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Main Screen Styles
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
    },
    loadingSubtext: {
        fontSize: 14,
        marginTop: 8,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    vsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    playerContainer: {
        alignItems: 'center',
        flex: 1,
    },
    avatarBig: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 24,
    },
    playerName: {
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 2,
        maxWidth: 100,
        textAlign: 'center',
    },
    playerLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    vsBadge: {
        backgroundColor: '#1a1a1a',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6,
    },
    vsText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    },
    scoreBoard: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    pendingContent: {
        padding: 24,
        alignItems: 'center',
    },
    pendingTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 6,
    },
    pendingSubtext: {
        fontSize: 14,
        marginBottom: 16,
    },
    matchIdBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    matchIdText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    scheduledContent: {
        padding: 24,
        alignItems: 'center',
    },
    scheduledIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    scheduledTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 6,
    },
    scheduledSubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    startTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    startTimeText: {
        fontSize: 15,
        fontWeight: '700',
    },
    activeContent: {
        padding: 20,
        alignItems: 'center',
    },
    challengeLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 20,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    scoreBlock: {
        alignItems: 'center',
        minWidth: 100,
    },
    scoreBig: {
        fontSize: 32,
        fontWeight: '800',
    },
    scorePlayerLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    scoreDivider: {
        paddingHorizontal: 16,
    },
    dividerText: {
        fontSize: 24,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statsSection: {
        marginBottom: 16,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 8,
    },
    statLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    surrenderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        marginTop: 10,
    },
    surrenderText: {
        fontSize: 15,
        fontWeight: '700',
    },
    resultSection: {
        marginTop: 8,
    },
    resultCard: {
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 12,
        marginBottom: 6,
    },
    resultSubtext: {
        fontSize: 15,
        textAlign: 'center',
    },
    coachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    coachButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    rematchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    rematchText: {
        fontSize: 15,
        fontWeight: '700',
    }
});
