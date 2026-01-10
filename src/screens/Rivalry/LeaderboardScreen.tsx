import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

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
                    // Filter out users with 0 points if desired, or keep all
                    setLeaderboard(data);

                    // Find me
                    const myRankIndex = data.findIndex((u: any) => u.user_id === user.id);
                    if (myRankIndex >= 0) {
                        setUserRank({ ...data[myRankIndex], rank: myRankIndex + 1 });
                    } else {
                        setUserRank(null);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [filter])
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isUser = userRank && item.user_id === userRank.user_id; // Check if this row is the current user
        const rank = index + 1;

        return (
            <View style={[
                styles.rankItem,
                { backgroundColor: isUser ? theme.colors.primary + '20' : palette.card, borderColor: isUser ? theme.colors.primary : palette.border }
            ]}>
                <View style={styles.rankLeft}>
                    <Text style={[styles.rankNumber, { color: rank <= 3 ? theme.colors.warning : palette.subText }]}>
                        #{rank}
                    </Text>
                    <View style={[styles.avatar, { backgroundColor: palette.border }]}>
                        {/* Placeholder for avatar */}
                        <Ionicons name="person" size={20} color={palette.subText} />
                    </View>
                    <Text style={[styles.userName, { color: palette.text, fontWeight: isUser ? '700' : '500' }]}>
                        {item.username}
                    </Text>
                </View>
                <Text style={[styles.score, { color: theme.colors.primary }]}>{item.points.toLocaleString()}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => (navigation as any).navigate('Rivalry')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Ranking</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={[styles.filterContainer, { backgroundColor: palette.card }]}>
                <Pressable
                    style={[styles.filterTab, filter === 'weekly' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilter('weekly')}
                >
                    <Text style={[styles.filterText, { color: filter === 'weekly' ? '#fff' : palette.subText }]}>Tygodniowy</Text>
                </Pressable>
                <Pressable
                    style={[styles.filterTab, filter === 'monthly' && { backgroundColor: theme.colors.primary }]}
                    onPress={() => setFilter('monthly')}
                >
                    <Text style={[styles.filterText, { color: filter === 'monthly' ? '#fff' : palette.subText }]}>Miesięczny</Text>
                </Pressable>
            </View>

            {/* List */}
            <FlatList
                data={leaderboard}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.user_id || index.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* User Stickey Footer (if not visible) - Optional, simplified for now */}
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 4,
        marginBottom: 20,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 12,
    },
    filterText: {
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    rankItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    rankLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        minWidth: 30,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 16,
    },
    score: {
        fontWeight: '800',
        fontSize: 16,
    }
});
