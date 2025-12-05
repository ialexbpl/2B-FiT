import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, TouchableWithoutFeedback, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, type Palette } from '@styles/theme';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { fetchSleepEntries, upsertSleepEntry, deleteSleepEntry } from '@utils/sleepApi';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

type SleepEntry = {
    bedtime: string;
    wakeTime: string;
    hours: number;
};

type SleepDataMap = {
    [date: string]: SleepEntry;
};

const LOCAL_STORAGE_KEY = 'sleep:data';

const getDayOfWeek = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};

const getDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const getLast7Days = (): { date: Date; dayName: string; dateKey: string }[] => {
    const days: { date: Date; dayName: string; dateKey: string }[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push({
            date,
            dayName: getDayOfWeek(date),
            dateKey: getDateKey(date),
        });
    }
    return days;
};

const calculateSleepHours = (bedtime: Date, wakeTime: Date): number => {
    let diff = wakeTime.getTime() - bedtime.getTime();
    if (diff < 0) {
        diff += 24 * 60 * 60 * 1000;
    }
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
};

export const SleepChart: React.FC<Props> = ({ styles, palette }) => {
    const { isDark } = useTheme();
    const { session } = useAuth();
    const userId = session?.user?.id;

    const [sleepData, setSleepData] = useState<SleepDataMap>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [bedtime, setBedtime] = useState(new Date());
    const [wakeTime, setWakeTime] = useState(new Date());
    const [showBedtimePicker, setShowBedtimePicker] = useState(false);
    const [showWakeTimePicker, setShowWakeTimePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const last7Days = useMemo(() => getLast7Days(), []);
    const startDate = last7Days[0].dateKey;
    const endDate = last7Days[last7Days.length - 1].dateKey;

    // Load data from local storage first (for fast startup), then sync from Supabase
    const loadData = useCallback(async () => {
        // Load local cache first
        try {
            const saved = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                setSleepData(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load local sleep data', e);
        }

        // Then fetch from Supabase if logged in
        if (userId) {
            try {
                const entries = await fetchSleepEntries(userId, startDate, endDate);
                const dataMap: SleepDataMap = {};
                entries.forEach(entry => {
                    dataMap[entry.date] = {
                        bedtime: entry.bedtime,
                        wakeTime: entry.wake_time,
                        hours: entry.hours,
                    };
                });
                setSleepData(dataMap);
                // Update local cache with server data
                await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataMap));
            } catch (e) {
                console.warn('Failed to fetch sleep data from Supabase', e);
            }
        }
    }, [userId, startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const saveToLocal = async (data: SleepDataMap) => {
        try {
            await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save local sleep data', e);
        }
    };

    const chartData = useMemo(() => {
        return last7Days.map(({ dayName, dateKey }) => ({
            day: dayName,
            dateKey,
            hours: sleepData[dateKey]?.hours ?? 0,
        }));
    }, [last7Days, sleepData]);

    const maxSleep = Math.max(...chartData.map(item => item.hours), 8);
    const todayKey = getDateKey(new Date());

    const handleDayPress = (dateKey: string) => {
        setSelectedDate(dateKey);
        const existing = sleepData[dateKey];
        if (existing) {
            setBedtime(new Date(existing.bedtime));
            setWakeTime(new Date(existing.wakeTime));
        } else {
            const defaultBedtime = new Date();
            defaultBedtime.setHours(22, 0, 0, 0);
            const defaultWake = new Date();
            defaultWake.setHours(6, 0, 0, 0);
            setBedtime(defaultBedtime);
            setWakeTime(defaultWake);
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setShowBedtimePicker(false);
        setShowWakeTimePicker(false);
    };

    const handleSave = async () => {
        if (!selectedDate) return;
        setIsSaving(true);

        const hours = calculateSleepHours(bedtime, wakeTime);
        const entry: SleepEntry = {
            bedtime: bedtime.toISOString(),
            wakeTime: wakeTime.toISOString(),
            hours,
        };

        const newData: SleepDataMap = { ...sleepData, [selectedDate]: entry };
        setSleepData(newData);
        await saveToLocal(newData);

        // Sync to Supabase if logged in
        if (userId) {
            try {
                await upsertSleepEntry(userId, {
                    date: selectedDate,
                    bedtime: entry.bedtime,
                    wake_time: entry.wakeTime,
                    hours: entry.hours,
                });
            } catch (e) {
                console.warn('Failed to sync sleep entry to Supabase', e);
            }
        }

        setIsSaving(false);
        closeModal();
    };

    const handleDelete = async () => {
        if (!selectedDate) return;
        setIsSaving(true);

        const newData = { ...sleepData };
        delete newData[selectedDate];
        setSleepData(newData);
        await saveToLocal(newData);

        // Delete from Supabase if logged in
        if (userId) {
            try {
                await deleteSleepEntry(userId, selectedDate);
            } catch (e) {
                console.warn('Failed to delete sleep entry from Supabase', e);
            }
        }

        setIsSaving(false);
        closeModal();
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const onBedtimeChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') setShowBedtimePicker(false);
        if (date) setBedtime(date);
    };

    const onWakeTimeChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') setShowWakeTimePicker(false);
        if (date) setWakeTime(date);
    };

    const getSelectedDateLabel = (): string => {
        if (!selectedDate) return '';
        const date = new Date(selectedDate + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (selectedDate === getDateKey(today)) return 'Today';
        if (selectedDate === getDateKey(yesterday)) return 'Yesterday';
        return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <View style={[styles.card, styles.largeCard]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>Sleep</Text>
                    <Text style={styles.cardSubtitle}>Last 7 days</Text>
                </View>
                <Ionicons name="moon" size={20} color={palette.primary} />
            </View>

            <View style={styles.chartContainer}>
                <View style={styles.chartRow}>
                    {chartData.map((item, index) => {
                        const barHeight = item.hours > 0 ? (item.hours / maxSleep) * 80 : 8;
                        const isToday = item.dateKey === todayKey;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.barContainer}
                                onPress={() => handleDayPress(item.dateKey)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: barHeight,
                                            backgroundColor: item.hours === 0 
                                                ? palette.border 
                                                : item.hours >= 7 
                                                    ? palette.primary 
                                                    : palette.subText,
                                        }
                                    ]}
                                />
                                <Text style={[
                                    styles.barLabel,
                                    isToday && { fontWeight: '700', color: palette.text }
                                ]}>
                                    {item.day}
                                </Text>
                                <Text style={[styles.barLabel, { fontSize: 9 }]}>
                                    {item.hours > 0 ? `${item.hours}h` : '--'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={closeModal}>
                <Pressable
                    style={{ flex: 1, backgroundColor: palette.overlay, justifyContent: 'center', padding: 20 }}
                    onPress={closeModal}
                >
                    <TouchableWithoutFeedback>
                        <View style={{
                            backgroundColor: palette.card100,
                            borderRadius: theme.radius.lg,
                            padding: 24,
                            borderColor: palette.border,
                            borderWidth: 1,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="moon" size={22} color={palette.primary} style={{ marginRight: 10 }} />
                                <Text style={{ fontSize: 20, fontWeight: '700', color: palette.text }}>
                                    Log Sleep
                                </Text>
                            </View>
                            <Text style={{ color: palette.subText, marginBottom: 20, fontSize: 14 }}>
                                {getSelectedDateLabel()}
                            </Text>

                            {/* Bedtime */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ color: palette.text, fontWeight: '600', marginBottom: 10, fontSize: 15 }}>
                                    Bedtime
                                </Text>
                                <TouchableOpacity
                                    onPress={() => { setShowBedtimePicker(true); setShowWakeTimePicker(false); }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: palette.border,
                                        borderRadius: theme.radius.md,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        backgroundColor: palette.background,
                                    }}
                                >
                                    <Ionicons name="bed-outline" size={22} color={palette.primary} />
                                    <Text style={{ color: palette.text, marginLeft: 14, fontSize: 17, fontWeight: '500' }}>
                                        {formatTime(bedtime)}
                                    </Text>
                                </TouchableOpacity>
                                {showBedtimePicker && (
                                    <View style={{ marginTop: 10, backgroundColor: isDark ? '#1e2530' : '#f5f5f5', borderRadius: theme.radius.md, overflow: 'hidden' }}>
                                        <DateTimePicker
                                            value={bedtime}
                                            mode="time"
                                            is24Hour={false}
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onBedtimeChange}
                                            textColor={palette.text}
                                            themeVariant={isDark ? 'dark' : 'light'}
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Wake Time */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ color: palette.text, fontWeight: '600', marginBottom: 10, fontSize: 15 }}>
                                    Wake Time
                                </Text>
                                <TouchableOpacity
                                    onPress={() => { setShowWakeTimePicker(true); setShowBedtimePicker(false); }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: 1,
                                        borderColor: palette.border,
                                        borderRadius: theme.radius.md,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        backgroundColor: palette.background,
                                    }}
                                >
                                    <Ionicons name="sunny-outline" size={22} color={palette.primary} />
                                    <Text style={{ color: palette.text, marginLeft: 14, fontSize: 17, fontWeight: '500' }}>
                                        {formatTime(wakeTime)}
                                    </Text>
                                </TouchableOpacity>
                                {showWakeTimePicker && (
                                    <View style={{ marginTop: 10, backgroundColor: isDark ? '#1e2530' : '#f5f5f5', borderRadius: theme.radius.md, overflow: 'hidden' }}>
                                        <DateTimePicker
                                            value={wakeTime}
                                            mode="time"
                                            is24Hour={false}
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onWakeTimeChange}
                                            textColor={palette.text}
                                            themeVariant={isDark ? 'dark' : 'light'}
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Total Sleep */}
                            <View style={{
                                backgroundColor: palette.background,
                                borderRadius: theme.radius.md,
                                padding: 16,
                                marginBottom: 20,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: palette.border,
                            }}>
                                <Text style={{ color: palette.subText, fontSize: 13, marginBottom: 4 }}>Total Sleep</Text>
                                <Text style={{ color: palette.primary, fontSize: 28, fontWeight: '700' }}>
                                    {calculateSleepHours(bedtime, wakeTime)} hours
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                {sleepData[selectedDate || ''] ? (
                                    <TouchableOpacity 
                                        onPress={handleDelete}
                                        disabled={isSaving}
                                        style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.radius.sm, backgroundColor: 'rgba(239, 68, 68, 0.1)', opacity: isSaving ? 0.5 : 1 }}
                                    >
                                        <Text style={{ color: theme.colors.danger, fontWeight: '600', fontSize: 15 }}>Delete</Text>
                                    </TouchableOpacity>
                                ) : <View />}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity onPress={closeModal} disabled={isSaving} style={{ paddingVertical: 10, paddingHorizontal: 16, marginRight: 12 }}>
                                        <Text style={{ color: palette.subText, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleSave}
                                        disabled={isSaving}
                                        style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: palette.primary, borderRadius: theme.radius.sm, opacity: isSaving ? 0.5 : 1 }}
                                    >
                                        <Text style={{ color: palette.onPrimary, fontWeight: '700', fontSize: 15 }}>
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Pressable>
            </Modal>
        </View>
    );
};
