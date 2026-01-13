import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
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
    const [loading, setLoading] = React.useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                try {
                    const { supabase } = require('../../utils/supabase');
                    const { getActiveChallenges, getLeaderboard } = require('../../api/rivalryService');

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const challenges = await getActiveChallenges(user.id);
                        setActiveChallenges(challenges);

                        const leaderboard = await getLeaderboard('weekly');
                        const rankIndex = leaderboard.findIndex((entry: any) => entry.user_id === user.id);
                        if (rankIndex >= 0) {
                            setUserRank(rankIndex + 1);
                            setSummary(leaderboard[rankIndex]);
                        } else {
                            setUserRank(null);
                            setSummary({ points: 0, wins: 0, matches_played: 0 });
                        }
                    }
                } catch (e) {
                    console.warn("Failed to load rivalry data", e);
                    setSummary({ points: 0, wins: 0, matches_played: 0 });
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [])
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Fixed Header */}
            <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                <Pressable onPress={() => navigation.navigate('Dashboard')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Rivalry</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: palette.subText }]}>Loading...</Text>
                    </View>
                ) : (
                    <>
                        {/* Hero Section - User Rank */}
                        <LinearGradient
                            colors={[theme.colors.primary, '#16a34a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroContent}>
                                <View style={styles.heroLeft}>
                                    <Text style={styles.heroLabel}>Your Rank</Text>
                                    <Text style={styles.heroRank}>{userRank ? `#${userRank}` : '--'}</Text>
                                    <Text style={styles.heroSubtext}>
                                        {summary?.points > 0 ? `${summary.points} points` : 'Start a challenge!'}
                                    </Text>
                                </View>
                                <View style={styles.trophyContainer}>
                                    <Ionicons name="trophy" size={56} color="#FFD700" />
                                </View>
                            </View>
                            <Pressable
                                style={styles.heroButton}
                                onPress={() => navigation.navigate('Leaderboard')}
                            >
                                <Text style={[styles.heroButtonText, { color: theme.colors.primary }]}>View Leaderboard</Text>
                                <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                            </Pressable>
                        </LinearGradient>

                        {/* Stats Grid */}
                        <View style={styles.statsSection}>
                            <Text style={[styles.sectionLabel, { color: palette.subText }]}>This Week</Text>
                            <View style={styles.statsGrid}>
                                <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                                        <Ionicons name="flash" size={20} color={theme.colors.primary} />
                                    </View>
                                    <Text style={[styles.statValue, { color: palette.text }]}>{summary?.matches_played || 0}</Text>
                                    <Text style={[styles.statLabel, { color: palette.subText }]}>Challenges</Text>
                                </View>
                                <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
                                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                                    </View>
                                    <Text style={[styles.statValue, { color: theme.colors.success }]}>{summary?.wins || 0}</Text>
                                    <Text style={[styles.statLabel, { color: palette.subText }]}>Wins</Text>
                                </View>
                                <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
                                        <Ionicons name="star" size={20} color={theme.colors.warning} />
                                    </View>
                                    <Text style={[styles.statValue, { color: theme.colors.warning }]}>{summary?.points || 0}</Text>
                                    <Text style={[styles.statLabel, { color: palette.subText }]}>Points</Text>
                                </View>
                            </View>
                        </View>

                        {/* Active Challenges Section */}
                        <View style={styles.challengesSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: palette.text }]}>Active Challenges</Text>
                                <Pressable 
                                    onPress={() => navigation.navigate('Challenges')}
                                    style={styles.viewAllButton}
                                >
                                    <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>View All</Text>
                                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                                </Pressable>
                            </View>

                            {activeChallenges.length > 0 ? (
                                activeChallenges.slice(0, 3).map((challenge, index) => (
                                    <Pressable
                                        key={challenge.id || index}
                                        style={[styles.challengeCard, { backgroundColor: palette.card, borderColor: palette.border }]}
                                        onPress={() => navigation.navigate('Duel', { challengeId: challenge.id })}
                                    >
                                        <View style={styles.challengeHeader}>
                                            <View style={styles.userInfo}>
                                                <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '20' }]}>
                                                    {challenge.opponent?.avatar_url ? (
                                                        <Image 
                                                            source={{ uri: challenge.opponent.avatar_url }} 
                                                            style={styles.avatarImage} 
                                                        />
                                                    ) : (
                                                        <Ionicons name="person" size={20} color={theme.colors.primary} />
                                                    )}
                                                </View>
                                                <View style={styles.challengeInfo}>
                                                    <Text style={[styles.userName, { color: palette.text }]}>
                                                        {challenge.opponent?.full_name || 'Opponent'}
                                                    </Text>
                                                    <Text style={[styles.challengeType, { color: palette.subText }]}>
                                                        {challenge.challenge_type} • {challenge.duration_hours}h
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                                                <Text style={[styles.statusText, { color: theme.colors.warning }]}>Active</Text>
                                            </View>
                                        </View>

                                        <View style={styles.progressContainer}>
                                            <View style={[styles.progressBar, { backgroundColor: palette.border }]}>
                                                <View 
                                                    style={[
                                                        styles.progressFill, 
                                                        { 
                                                            width: `${Math.min((challenge.challenger_progress / challenge.target_value) * 100, 100)}%`, 
                                                            backgroundColor: theme.colors.primary 
                                                        }
                                                    ]} 
                                                />
                                            </View>
                                            <View style={styles.progressLabels}>
                                                <Text style={[styles.progressText, { color: palette.text }]}>
                                                    You: {challenge.challenger_progress || 0}
                                                </Text>
                                                <Text style={[styles.progressText, { color: palette.subText }]}>
                                                    Goal: {challenge.target_value}
                                                </Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))
                            ) : (
                                <View style={[styles.emptyState, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                    <Ionicons name="fitness-outline" size={48} color={palette.subText} />
                                    <Text style={[styles.emptyTitle, { color: palette.text }]}>No Active Challenges</Text>
                                    <Text style={[styles.emptySubtext, { color: palette.subText }]}>
                                        Start a quick match to compete with others!
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Quick Match Button */}
                        <View style={styles.actionsContainer}>
                            <Pressable
                                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                                onPress={() => navigation.navigate('Duel', { isQuickMatch: true })}
                            >
                                <Ionicons name="flash" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>Quick Match</Text>
                            </Pressable>
                        </View>
                    </>
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    heroCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    heroLeft: {
        flex: 1,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroRank: {
        color: '#fff',
        fontSize: 44,
        fontWeight: '800',
        lineHeight: 50,
    },
    heroSubtext: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontWeight: '500',
        marginTop: 4,
    },
    trophyContainer: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 12,
        borderRadius: 20,
    },
    heroButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    heroButtonText: {
        fontWeight: '700',
        fontSize: 15,
    },
    statsSection: {
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    challengesSection: {
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    challengeCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    challengeInfo: {
        flex: 1,
    },
    userName: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    challengeType: {
        fontSize: 13,
        textTransform: 'capitalize',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressContainer: {
        gap: 6,
    },
    progressBar: {
        height: 8,
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
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    actionsContainer: {
        marginTop: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 16,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    }
});
