import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, TextInput, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';
import { useSteps } from '@hooks/useSteps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const StepsCard: React.FC<Props> = ({ styles, palette }) => {
    const [goalSteps, setGoalSteps] = useState(10000);
    const [goalInput, setGoalInput] = useState('10000');
    const [goalModalVisible, setGoalModalVisible] = useState(false);
    const STORAGE_KEY = 'steps:goal';
    const HIGHSCORE_KEY = 'steps:highscore';
    const [highscore, setHighscore] = useState<{ steps: number; date: string } | null>(null);
    const CALORIES_PER_STEP = 0.04; // rough average kcal per step

    const { steps, isAvailable, loading, error, refresh } = useSteps(goalSteps);
    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], [steps, goalSteps]);
    const burnedKcal = useMemo(() => Math.max(0, Math.round(steps * CALORIES_PER_STEP)), [steps]);

    useEffect(() => {
        const loadGoal = async () => {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = Number(saved);
                if (Number.isFinite(parsed) && parsed > 0) {
                    setGoalSteps(parsed);
                    setGoalInput(String(parsed));
                }
            }
        };
        const loadHighscore = async () => {
            const saved = await AsyncStorage.getItem(HIGHSCORE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed.steps === 'number' && parsed.steps > 0) {
                        setHighscore({ steps: parsed.steps, date: parsed.date || todayKey });
                    }
                } catch {
                    // ignore parse errors
                }
            }
        };
        loadGoal();
        loadHighscore();
    }, [todayKey]);
    const progress = useMemo(() => {
        const ratio = goalSteps > 0 ? steps / goalSteps : 0;
        return Math.max(0, Math.min(ratio, 1));
    }, [goalSteps, steps]);

    useEffect(() => {
        if (steps <= 0) return;
        setHighscore(prev => {
            const currentBest = prev?.steps ?? 0;
            if (steps > currentBest) {
                const next = { steps, date: todayKey };
                AsyncStorage.setItem(HIGHSCORE_KEY, JSON.stringify(next)).catch(() => { });
                return next;
            }
            return prev;
        });
    }, [steps, todayKey]);

    const evaluateStreak = useCallback(async () => {
        if (goalSteps <= 0) return;
        if (steps < goalSteps) return; // count streak day only when goal met
        try {
            const saved = await AsyncStorage.getItem('steps:streak');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayKey = yesterday.toISOString().split('T')[0];
            let best = 0;
            let current = 0;
            let lastDate = '';

            if (saved) {
                const parsed = JSON.parse(saved);
                best = parsed.best || 0;
                current = parsed.current || 0;
                lastDate = parsed.lastDate || '';
            }

            if (lastDate === todayKey) return; // already counted today

            if (lastDate === yesterdayKey) {
                current += 1;
            } else {
                current = 1;
            }

            if (current > best) best = current;

            const payload = { current, best, lastDate: todayKey };
            await AsyncStorage.setItem('steps:streak', JSON.stringify(payload));
        } catch {
            // ignore
        }
    }, [goalSteps, steps, todayKey]);

    useEffect(() => {
        evaluateStreak();
    }, [evaluateStreak]);

    useEffect(() => {
        const id = setInterval(() => {
            refresh().catch(() => { });
        }, 30000);
        return () => clearInterval(id);
    }, [refresh]);

    useEffect(() => {
        const id = setInterval(() => {
            evaluateStreak();
        }, 60000);
        return () => clearInterval(id);
    }, [evaluateStreak]);

    const handleSaveGoal = async () => {
        const parsed = Math.max(1, Math.round(Number(goalInput.replace(/\D+/g, '')) || 0));
        setGoalSteps(parsed);
        setGoalInput(String(parsed));
        await AsyncStorage.setItem(STORAGE_KEY, String(parsed));
        setGoalModalVisible(false);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, styles.smallCard]}
            onPress={() => setGoalModalVisible(true)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Steps</Text>
                <Ionicons name="walk" size={20} color={palette.primary} />
            </View>

            <View style={styles.progressContainer}>
                {loading ? (
                    <ActivityIndicator color={palette.primary} />
                ) : !isAvailable ? (
                    <View style={styles.stepsTextContainer}>
                        <Text style={styles.stepsCurrent}>Unavailable</Text>
                        <TouchableOpacity onPress={refresh} style={{ marginTop: 6 }}>
                            <Text style={[styles.stepsGoal, { color: palette.primary }]}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : error ? (
                    <View style={styles.stepsTextContainer}>
                        <Text style={styles.stepsCurrent}>No data</Text>
                        <TouchableOpacity onPress={refresh} style={{ marginTop: 6 }}>
                            <Text style={[styles.stepsGoal, { color: palette.primary }]}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Progress Ring */}
                        <RingProgress styles={styles} palette={palette} progress={progress} current={steps} goal={goalSteps} />
                        <View style={[styles.stepsTextContainer, { marginTop: 6 }]}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>
                                {burnedKcal} kcal burned
                            </Text>
                        </View>
                    </>
                )}
            </View>

            <Modal
                visible={goalModalVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setGoalModalVisible(false)}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    onPress={() => setGoalModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View
                            style={{
                                backgroundColor: palette.card100,
                                borderRadius: 16,
                                padding: 20,
                                borderColor: palette.border,
                                borderWidth: 1,
                            }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: '700', color: palette.text }}>
                                Step goal
                            </Text>
                            <Text style={{ color: palette.subText, marginTop: 6, fontSize: 13 }}>
                                Enter your daily target (steps).
                            </Text>
                            <TextInput
                                value={goalInput}
                                onChangeText={setGoalInput}
                                keyboardType="numeric"
                                style={{
                                    marginTop: 12,
                                    borderWidth: 1,
                                    borderColor: palette.border,
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    color: palette.text,
                                    backgroundColor: palette.card100,
                                }}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                                <TouchableOpacity onPress={() => setGoalModalVisible(false)} style={{ marginRight: 12 }}>
                                    <Text style={{ color: palette.subText, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSaveGoal}>
                                    <Text style={{ color: palette.primary, fontWeight: '700' }}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Pressable>
            </Modal>
        </TouchableOpacity>
    );
};

const RingProgress: React.FC<{
    styles: Styles;
    palette: Palette;
    progress: number;
    current: number;
    goal: number;
}> = ({ styles, palette, progress, current, goal }) => {
    const size = 90;
    const thickness = 8;
    const clamped = Math.max(0, Math.min(progress, 1));
    const percent = Math.round(clamped * 100);
    const center = size / 2;
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - clamped);

    return (
        <View style={[styles.ringContainer, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={palette.border}
                    strokeWidth={thickness}
                    fill="none"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={palette.primary}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
            <View
                style={[
                    styles.ringCenter,
                    {
                        width: size - thickness * 2.5,
                        height: size - thickness * 2.5,
                        borderRadius: (size - thickness * 2.5) / 2,
                        backgroundColor: palette.card100,
                    },
                ]}
            >
                <Text style={{ fontWeight: '700', color: palette.text }}>
                    {current.toLocaleString()}
                </Text>
                <Text style={{ color: palette.subText, fontSize: 12 }}>
                    / {goal.toLocaleString()}
                </Text>
            </View>
        </View>
    );
};
