import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export const RivalryScreen = () => {
    const { theme, palette } = useTheme();
    const navigation = useNavigation<any>();
    const [summary, setSummary] = React.useState<any>(null);
    const [activeChallenges, setActiveChallenges] = React.useState<any[]>([]);
    const [userRank, setUserRank] = React.useState<number | null>(null);
    // const [loading, setLoading] = React.useState(false); // Unused for now, but good practice

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                try {
                    const { supabase } = require('../../utils/supabase');
                    const { getActiveChallenges, getLeaderboard } = require('../../api/rivalryService');

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const challenges = await getActiveChallenges(user.id);
                        setActiveChallenges(challenges);

                        // Fetch leaderboard to find user's rank AND weekly stats
                        const leaderboard = await getLeaderboard('weekly');
                        const rankIndex = leaderboard.findIndex((entry: any) => entry.user_id === user.id);
                        if (rankIndex >= 0) {
                            setUserRank(rankIndex + 1); // Rank is 1-indexed
                            // Use weekly stats from leaderboard for consistency
                            setSummary(leaderboard[rankIndex]);
                        } else {
                            setUserRank(null); // User not in leaderboard (0 matches this week)
                            setSummary({ points: 0, wins: 0, matches_played: 0 });
                        }
                    }
                } catch (e) {
                    console.error("Failed to load rivalry data", e);
                }
            };
            loadData();
        }, [])
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={palette.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: palette.text }]}>Rywalizacja</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Hero Section - User Rank */}
                <LinearGradient
                    colors={[theme.colors.primary, '#16a34a']} // Gradient based on primary color
                    style={styles.heroCard}
                >
                    <View style={styles.heroContent}>
                        <View>
                            <Text style={styles.heroLabel}>Twoja Pozycja</Text>
                            <Text style={styles.heroRank}>{userRank ? `#${userRank}` : '--'}</Text>
                            <Text style={styles.heroSubtext}>
                                {summary?.points > 0 ? `${summary.points} punktów` : 'Rozpocznij wyzwanie!'}
                            </Text>
                        </View>
                        <View style={styles.trophyContainer}>
                            <Ionicons name="trophy" size={64} color="#FFD700" />
                        </View>
                    </View>
                    <Pressable
                        style={styles.heroButton}
                        onPress={() => navigation.navigate('Leaderboard')}
                    >
                        <Text style={[styles.heroButtonText, { color: theme.colors.primary }]}>Zobacz Ranking</Text>
                        <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                    </Pressable>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <Text style={[styles.statValue, { color: palette.text }]}>{summary?.matches_played || 0}</Text>
                        <Text style={[styles.statLabel, { color: palette.subText }]}>Wyzwania (7 dni)</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <Text style={[styles.statValue, { color: theme.colors.success }]}>{summary?.wins || 0}</Text>
                        <Text style={[styles.statLabel, { color: palette.subText }]}>Wygrane (7 dni)</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <Text style={[styles.statValue, { color: theme.colors.danger }]}>{summary?.points || 0}</Text>
                        <Text style={[styles.statLabel, { color: palette.subText }]}>Punkty (7 dni)</Text>
                    </View>
                </View>

                {/* Active Challenges Preview */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: palette.text }]}>Aktywne Wyzwania</Text>
                    <Pressable onPress={() => navigation.navigate('Challenges')}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Zobacz wszystkie</Text>
                    </Pressable>
                </View>

                {activeChallenges.length > 0 ? (
                    activeChallenges.map((challenge, index) => (
                        <Pressable
                            key={index}
                            style={[styles.challengeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
                            onPress={() => navigation.navigate('Duel', { challengeId: challenge.id })}
                        >
                            <View style={styles.challengeHeader}>
                                <View style={styles.userInfo}>
                                    <View style={[styles.avatar, { backgroundColor: '#ddd' }]}>
                                        {challenge.opponent?.avatar_url &&
                                            <Image source={{ uri: challenge.opponent.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                        }
                                    </View>
                                    <View>
                                        <Text style={[styles.userName, { color: palette.text }]}>{challenge.opponent?.full_name || 'Przeciwnik'}</Text>
                                        <Text style={[styles.challengeType, { color: palette.subText }]}>{challenge.challenge_type} • {challenge.duration_hours}h</Text>
                                    </View>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: theme.colors.warning }]}>
                                    <Text style={styles.statusText}>Trwa</Text>
                                </View>
                            </View>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: '50%', backgroundColor: theme.colors.primary }]} />
                                </View>
                                <View style={styles.progressLabels}>
                                    <Text style={[styles.progressText, { color: palette.subText }]}>Ty: {challenge.challenger_progress}</Text>
                                    <Text style={[styles.progressText, { color: palette.subText }]}>Cel: {challenge.target_value}</Text>
                                </View>
                            </View>
                        </Pressable>
                    ))
                ) : (
                    <Text style={{ color: palette.subText, marginBottom: 20, fontStyle: 'italic' }}>Brak aktywnych wyzwań.</Text>
                )}

                {/* Acton Buttons */}
                <View style={styles.actionsContainer}>
                    <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => navigation.navigate('Duel', { isQuickMatch: true })}
                    >
                        <Ionicons name="flash" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Szybki Pojedynek</Text>
                    </Pressable>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: "#22c55e",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    heroRank: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '800',
        lineHeight: 56,
    },
    heroSubtext: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        opacity: 0.9,
    },
    trophyContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 12,
        borderRadius: 20,
    },
    heroButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    heroButtonText: {
        fontWeight: '700',
        fontSize: 14,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    challengeCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userName: {
        fontWeight: '700',
        fontSize: 16,
    },
    challengeType: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    progressContainer: {
        gap: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionsContainer: {
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
