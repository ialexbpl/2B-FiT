import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export const LeaderboardScreen = () => {
    const { theme, palette } = useTheme();
    const navigation = useNavigation();
    const [filter, setFilter] = useState<'weekly' | 'monthly'>('weekly');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRank, setUserRank] = useState<any>(null);

    const { getLeaderboard } = require('../../api/rivalryService');
    const { supabase } = require('../../utils/supabase');

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const data = await getLeaderboard(filter);
                    setLeaderboard(data);

                    const myRankIndex = data.findIndex((u: any) => u.user_id === user.id);
                    if (myRankIndex >= 0) {
                        setUserRank({ ...data[myRankIndex], rank: myRankIndex + 1 });
                    } else {
                        setUserRank(null);
                    }
                } catch (e) {
                    console.warn(e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [filter])
    );

    const getRankIcon = (rank: number) => {
        if (rank === 1) return { icon: 'trophy', color: '#FFD700' };
        if (rank === 2) return { icon: 'medal', color: '#C0C0C0' };
        if (rank === 3) return { icon: 'medal', color: '#CD7F32' };
        return null;
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isUser = userRank && item.user_id === userRank.user_id;
        const rank = index + 1;
        const rankIcon = getRankIcon(rank);

        if (rank <= 3) {
            return (
                <LinearGradient
                    colors={isUser 
                        ? [theme.colors.primary + '25', theme.colors.primary + '10'] 
                        : [palette.card, palette.card]
                    }
                    style={[
                        styles.topRankItem,
                        { borderColor: isUser ? theme.colors.primary : palette.border }
                    ]}
                >
                    <View style={styles.topRankContent}>
                        <View style={[styles.rankBadge, { backgroundColor: rankIcon?.color + '20' }]}>
                            <Ionicons name={rankIcon?.icon as any} size={24} color={rankIcon?.color} />
                        </View>
                        <View style={styles.userDetails}>
                            <View style={[styles.avatarMedium, { backgroundColor: palette.border }]}>
                                {item.avatar_url ? (
                                    <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                                ) : (
                                    <Ionicons name="person" size={20} color={palette.subText} />
                                )}
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: palette.text, fontWeight: isUser ? '700' : '600' }]}>
                                    {item.username} {isUser && '(You)'}
                                </Text>
                                <Text style={[styles.userStats, { color: palette.subText }]}>
                                    {item.wins || 0} wins • {item.matches_played || 0} matches
                                </Text>
                            </View>
                        </View>
                        <View style={styles.scoreContainer}>
                            <Text style={[styles.score, { color: theme.colors.primary }]}>
                                {item.points?.toLocaleString() || 0}
                            </Text>
                            <Text style={[styles.scoreLabel, { color: palette.subText }]}>pts</Text>
                        </View>
                    </View>
                </LinearGradient>
            );
        }

        return (
            <View style={[
                styles.rankItem,
                { 
                    backgroundColor: isUser ? theme.colors.primary + '15' : palette.card, 
                    borderColor: isUser ? theme.colors.primary : palette.border 
                }
            ]}>
                <View style={styles.rankLeft}>
                    <Text style={[styles.rankNumber, { color: palette.subText }]}>
                        #{rank}
                    </Text>
                    <View style={[styles.avatarSmall, { backgroundColor: palette.border }]}>
                        {item.avatar_url ? (
                            <Image source={{ uri: item.avatar_url }} style={styles.avatarImageSmall} />
                        ) : (
                            <Ionicons name="person" size={16} color={palette.subText} />
                        )}
                    </View>
                    <Text style={[styles.userNameSmall, { color: palette.text, fontWeight: isUser ? '700' : '500' }]}>
                        {item.username} {isUser && '(You)'}
                    </Text>
                </View>
                <Text style={[styles.scoreSmall, { color: theme.colors.primary }]}>
                    {item.points?.toLocaleString() || 0}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Fixed Header */}
            <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                <Pressable onPress={() => (navigation as any).navigate('Rivalry')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Leaderboard</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={[styles.filterContainer, { backgroundColor: palette.card }]}>
                <Pressable
                    style={[styles.filterTab, filter === 'weekly' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilter('weekly')}
                >
                    <Ionicons 
                        name="calendar-outline" 
                        size={16} 
                        color={filter === 'weekly' ? '#fff' : palette.subText} 
                    />
                    <Text style={[styles.filterText, { color: filter === 'weekly' ? '#fff' : palette.subText }]}>
                        Weekly
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.filterTab, filter === 'monthly' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilter('monthly')}
                >
                    <Ionicons 
                        name="calendar" 
                        size={16} 
                        color={filter === 'monthly' ? '#fff' : palette.subText} 
                    />
                    <Text style={[styles.filterText, { color: filter === 'monthly' ? '#fff' : palette.subText }]}>
                        Monthly
                    </Text>
                </Pressable>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: palette.subText }]}>Loading leaderboard...</Text>
                </View>
            ) : leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: palette.card }]}>
                        <Ionicons name="podium-outline" size={56} color={palette.subText} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: palette.text }]}>No Rankings Yet</Text>
                    <Text style={[styles.emptyText, { color: palette.subText }]}>
                        Complete challenges to appear on the leaderboard!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={leaderboard}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.user_id || index.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* User Sticky Footer */}
            {userRank && !loading && (
                <View style={[styles.userFooter, { backgroundColor: palette.card, borderTopColor: palette.border }]}>
                    <View style={styles.footerContent}>
                        <View style={styles.footerLeft}>
                            <Text style={[styles.footerRank, { color: theme.colors.primary }]}>#{userRank.rank}</Text>
                            <Text style={[styles.footerName, { color: palette.text }]}>Your Position</Text>
                        </View>
                        <View style={styles.footerRight}>
                            <Text style={[styles.footerScore, { color: theme.colors.primary }]}>
                                {userRank.points?.toLocaleString() || 0}
                            </Text>
                            <Text style={[styles.footerLabel, { color: palette.subText }]}>points</Text>
                        </View>
                    </View>
                </View>
            )}
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
    filterContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        padding: 3,
        marginBottom: 8,
    },
    filterTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 9,
        gap: 5,
    },
    filterText: {
        fontWeight: '600',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 90,
    },
    topRankItem: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
    },
    topRankContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    userDetails: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarMedium: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        marginBottom: 2,
    },
    userStats: {
        fontSize: 12,
    },
    scoreContainer: {
        alignItems: 'flex-end',
    },
    score: {
        fontWeight: '800',
        fontSize: 20,
    },
    scoreLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
    rankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 8,
        borderRadius: 14,
        borderWidth: 1,
    },
    rankLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    rankNumber: {
        fontSize: 14,
        fontWeight: '700',
        minWidth: 32,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImageSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    userNameSmall: {
        fontSize: 15,
        flex: 1,
    },
    scoreSmall: {
        fontWeight: '700',
        fontSize: 16,
    },
    userFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    footerRank: {
        fontSize: 24,
        fontWeight: '800',
    },
    footerName: {
        fontSize: 15,
        fontWeight: '600',
    },
    footerRight: {
        alignItems: 'flex-end',
    },
    footerScore: {
        fontSize: 22,
        fontWeight: '800',
    },
    footerLabel: {
        fontSize: 12,
    }
});
