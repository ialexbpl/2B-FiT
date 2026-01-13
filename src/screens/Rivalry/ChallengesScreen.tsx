import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

export const ChallengesScreen = () => {
    const { theme, palette } = useTheme();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'active' | 'join' | 'history'>('active');
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);

    const { getActiveChallenges, getChallengeHistory, getOpenLobbies, joinChallenge } = require('../../api/rivalryService');
    const { supabase } = require('../../utils/supabase');

    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    let data = [];
                    if (activeTab === 'active') {
                        data = await getActiveChallenges(user.id);
                    } else if (activeTab === 'join') {
                        data = await getOpenLobbies(user.id);
                    } else {
                        data = await getChallengeHistory(user.id);
                    }
                    setChallenges(data);
                } catch (e) {
                    console.warn(e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [activeTab])
    );

    const handleJoinChallenge = async (challengeId: string) => {
        setJoining(challengeId);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'You must be logged in');
                return;
            }

            const joined = await joinChallenge(challengeId, user.id);
            if (joined) {
                Alert.alert('Success', 'You joined the duel!', [
                    { text: 'OK', onPress: () => (navigation as any).navigate('Duel', { challengeId: joined.id }) }
                ]);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to join challenge');
        } finally {
            setJoining(null);
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return { label: 'Active', color: theme.colors.warning, bg: theme.colors.warning + '20' };
            case 'pending':
                return { label: 'Waiting', color: theme.colors.primary, bg: theme.colors.primary + '20' };
            case 'finished':
                return { label: 'Finished', color: theme.colors.success, bg: theme.colors.success + '20' };
            case 'declined':
                return { label: 'Declined', color: theme.colors.danger, bg: theme.colors.danger + '20' };
            default:
                return { label: status, color: palette.subText, bg: palette.border };
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const isJoinTab = activeTab === 'join';
        const challengerName = item.challenger?.full_name || item.challenger?.username || 'Unknown';
        const opponentName = item.opponent?.full_name || item.opponent?.username || (item.status === 'pending' ? 'Waiting...' : 'Unknown');
        const statusConfig = getStatusConfig(item.status);

        if (isJoinTab) {
            // Open lobby card - show challenger info and join button
            return (
                <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.challengerInfo}>
                            <View style={[styles.avatarSmall, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Ionicons name="person" size={16} color={theme.colors.primary} />
                            </View>
                            <View style={styles.challengerDetails}>
                                <Text style={[styles.challengerName, { color: palette.text }]}>{challengerName}</Text>
                                <Text style={[styles.challengeInfo, { color: palette.subText }]}>wants to duel!</Text>
                            </View>
                        </View>
                        <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Open</Text>
                        </View>
                    </View>

                    <View style={styles.lobbyDetails}>
                        <View style={styles.detailItem}>
                            <Ionicons name="footsteps-outline" size={16} color={palette.subText} />
                            <Text style={[styles.detailText, { color: palette.text }]}>
                                {item.target_value?.toLocaleString()} steps
                            </Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={16} color={palette.subText} />
                            <Text style={[styles.detailText, { color: palette.text }]}>
                                {item.duration_hours}h duration
                            </Text>
                        </View>
                    </View>

                    <Pressable
                        style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleJoinChallenge(item.id)}
                        disabled={joining === item.id}
                    >
                        {joining === item.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="flash" size={18} color="#fff" />
                                <Text style={styles.joinButtonText}>Join Duel</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            );
        }

        // Regular challenge card
        return (
            <Pressable
                style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
                onPress={() => (navigation as any).navigate('Duel', { challengeId: item.id })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.vsContainer}>
                        <View style={[styles.avatarSmall, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons name="person" size={14} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.vsText, { color: palette.subText }]}>vs</Text>
                        <View style={[styles.avatarSmall, { backgroundColor: theme.colors.danger + '20' }]}>
                            <Ionicons name="person" size={14} color={theme.colors.danger} />
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                </View>

                <Text
                    style={[styles.matchup, { color: palette.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {challengerName} vs {opponentName}
                </Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="fitness-outline" size={14} color={palette.subText} />
                        <Text style={[styles.metaText, { color: palette.subText }]}>
                            {item.challenge_type}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flag-outline" size={14} color={palette.subText} />
                        <Text style={[styles.metaText, { color: palette.subText }]}>
                            {item.target_value}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={palette.subText} />
                        <Text style={[styles.metaText, { color: palette.subText }]}>
                            {item.duration_hours}h
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'active':
                return { title: 'No Active Challenges', subtitle: 'Start a quick match to compete!' };
            case 'join':
                return { title: 'No Open Lobbies', subtitle: 'No one is waiting for an opponent right now.' };
            case 'history':
                return { title: 'No History Yet', subtitle: 'Your completed challenges will appear here.' };
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Fixed Header */}
            <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
                <Pressable onPress={() => (navigation as any).navigate('Rivalry')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Challenges</Text>
                <Pressable 
                    onPress={() => (navigation as any).navigate('Duel', { isQuickMatch: true })} 
                    style={[styles.addButton, { backgroundColor: theme.colors.primary + '15' }]}
                >
                    <Ionicons name="add" size={22} color={theme.colors.primary} />
                </Pressable>
            </View>

            {/* Tab Switcher - 3 tabs */}
            <View style={[styles.tabContainer, { backgroundColor: palette.card }]}>
                <Pressable 
                    onPress={() => setActiveTab('active')} 
                    style={[
                        styles.tab, 
                        activeTab === 'active' && { backgroundColor: theme.colors.primary }
                    ]}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'active' ? '#fff' : palette.subText }
                    ]}>
                        Active
                    </Text>
                </Pressable>
                <Pressable 
                    onPress={() => setActiveTab('join')} 
                    style={[
                        styles.tab, 
                        activeTab === 'join' && { backgroundColor: theme.colors.primary }
                    ]}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'join' ? '#fff' : palette.subText }
                    ]}>
                        Join
                    </Text>
                </Pressable>
                <Pressable 
                    onPress={() => setActiveTab('history')} 
                    style={[
                        styles.tab, 
                        activeTab === 'history' && { backgroundColor: theme.colors.primary }
                    ]}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'history' ? '#fff' : palette.subText }
                    ]}>
                        History
                    </Text>
                </Pressable>
            </View>

            {/* List */}
            <FlatList
                data={challenges}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? (
                            <>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                                <Text style={[styles.emptyText, { color: palette.subText }]}>Loading...</Text>
                            </>
                        ) : (
                            <>
                                <View style={[styles.emptyIcon, { backgroundColor: palette.card }]}>
                                    <Ionicons 
                                        name={activeTab === 'join' ? 'people-outline' : activeTab === 'active' ? 'flash-outline' : 'time-outline'} 
                                        size={48} 
                                        color={palette.subText} 
                                    />
                                </View>
                                <Text style={[styles.emptyTitle, { color: palette.text }]}>
                                    {getEmptyMessage().title}
                                </Text>
                                <Text style={[styles.emptyText, { color: palette.subText }]}>
                                    {getEmptyMessage().subtitle}
                                </Text>
                            </>
                        )}
                    </View>
                }
            />
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 12,
        padding: 3,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 9,
    },
    tabText: {
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    card: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vsText: {
        fontSize: 12,
        fontWeight: '600',
    },
    matchup: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 13,
        textTransform: 'capitalize',
    },
    // Join tab specific styles
    challengerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    challengerDetails: {
        flex: 1,
    },
    challengerName: {
        fontSize: 16,
        fontWeight: '700',
    },
    challengeInfo: {
        fontSize: 13,
    },
    lobbyDetails: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 14,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
        fontWeight: '500',
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        maxWidth: 250,
    }
});
