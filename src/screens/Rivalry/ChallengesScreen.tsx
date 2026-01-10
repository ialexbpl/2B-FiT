import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';

export const ChallengesScreen = () => {
    const { theme, palette } = useTheme();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { getActiveChallenges, getChallengeHistory } = require('../../api/rivalryService');
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
                    } else {
                        data = await getChallengeHistory(user.id);
                    }
                    setChallenges(data);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [activeTab])
    );

    const renderItem = ({ item }: { item: any }) => {
        // Determine opponent helper
        const isChallenger = item.challenger_id === item.challenger?.id; // rough check, better to use current user context
        // Actually, the service already maps challenger/opponent objects.
        // We just need to know who is "the other guy".
        // Let's assume the service returns `challenger` and `opponent` objects fully populated.

        // This screen needs current user ID to know who is who for display name. 
        // For now, I'll just show both names vs.

        const opponentName = item.opponent?.full_name || item.opponent?.username || (item.status === 'pending' ? 'Oczekiwanie...' : 'Nieznany');
        const challengerName = item.challenger?.full_name || item.challenger?.username || 'Nieznany';

        return (
            <Pressable
                style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
                onPress={() => (navigation as any).navigate('Duel', { challengeId: item.id })}
            >
                <View style={styles.cardHeader}>
                    <Text
                        style={[styles.opponent, { color: palette.text, flex: 1, marginRight: 8 }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {challengerName} vs {opponentName}
                    </Text>
                    {activeTab === 'active' ? (
                        <View style={[styles.badge, { backgroundColor: theme.colors.warning + '20' }]}>
                            <Text style={[styles.badgeText, { color: theme.colors.warning }]}>
                                {item.status}
                            </Text>
                        </View>
                    ) : (
                        <Text style={{ color: item.winner_id ? theme.colors.success : palette.subText, fontWeight: '700' }}>
                            {item.status === 'finished' ? 'Zakończone' : item.status}
                        </Text>
                    )}
                </View>
                <Text style={[styles.subtext, { color: palette.subText }]}>
                    {item.challenge_type} • {item.target_value} • {new Date(item.start_time).toLocaleDateString()}
                </Text>
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
            <View style={styles.header}>
                <Pressable onPress={() => (navigation as any).navigate('Rivalry')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={palette.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: palette.text }]}>Wyzwania</Text>
                <Pressable onPress={() => (navigation as any).navigate('Rivalry')} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={theme.colors.primary} />
                </Pressable>
            </View>

            <View style={styles.tabs}>
                <Pressable onPress={() => setActiveTab('active')} style={[styles.tab, activeTab === 'active' && borderBottom(theme.colors.primary)]}>
                    <Text style={[styles.tabText, { color: activeTab === 'active' ? theme.colors.primary : palette.subText }]}>Aktywne</Text>
                </Pressable>
                <Pressable onPress={() => setActiveTab('history')} style={[styles.tab, activeTab === 'history' && borderBottom(theme.colors.primary)]}>
                    <Text style={[styles.tabText, { color: activeTab === 'history' ? theme.colors.primary : palette.subText }]}>Historia</Text>
                </Pressable>
            </View>

            <FlatList
                data={challenges}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: palette.subText }}>
                            {loading ? 'Ładowanie...' : 'Brak wyzwań w tej kategorii.'}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const borderBottom = (color: string) => ({
    borderBottomWidth: 2,
    borderBottomColor: color,
});

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
    addButton: {
        padding: 8,
        marginRight: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc', // fallback
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    tabText: {
        fontWeight: '600',
        fontSize: 16,
    },
    listContent: {
        padding: 20,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    opponent: {
        fontSize: 18,
        fontWeight: '700',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    subtext: {
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    }
});
