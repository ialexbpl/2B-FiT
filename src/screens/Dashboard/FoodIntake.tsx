// src/screens/Dashboard/FoodIntake.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';
import { useNutritionTargets } from '@hooks/useNutritionTargets';
import { useAuth } from '@context/AuthContext';
import { fetchDailyLog, calculateSummary } from '@utils/mealsApi';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const FoodIntake: React.FC<Props> = ({ styles, palette }) => {
    const { session } = useAuth();
    const targets = useNutritionTargets();
    const userId = session?.user?.id;
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(() => ({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
    }));

    const loadToday = useCallback(async () => {
        if (!userId) {
            setSummary({ calories: 0, protein: 0, carbs: 0, fat: 0 });
            return;
        }
        setLoading(true);
        try {
            const logs = await fetchDailyLog(userId, today);
            setSummary(calculateSummary(logs));
        } catch (e) {
            setSummary({ calories: 0, protein: 0, carbs: 0, fat: 0 });
        } finally {
            setLoading(false);
        }
    }, [today, userId]);

    useEffect(() => {
        loadToday();
    }, [loadToday]);

    useFocusEffect(
        useCallback(() => {
            loadToday();
        }, [loadToday])
    );

    const consumedKcal = summary.calories;
    const goalKcal = targets.calories || 0;

    const foodData = useMemo(() => ({
        consumed: consumedKcal,
        goal: goalKcal,
        protein: {
            consumed: summary.protein,
            goal: targets.protein_g || 0,
        },
        carbs: {
            consumed: summary.carbs,
            goal: targets.carbs_g || 0,
        },
        fat: {
            consumed: summary.fat,
            goal: targets.fat_g || 0,
        },
    }), [consumedKcal, goalKcal, summary.carbs, summary.fat, summary.protein, targets.carbs_g, targets.fat_g, targets.protein_g]);

    const progress = foodData.goal > 0 ? Math.min(1, Math.max(0, foodData.consumed / foodData.goal)) : 0;
    const remaining = Math.max(0, foodData.goal - foodData.consumed);
    const percentText = foodData.goal > 0 ? `${Math.round(progress * 100)}%` : '0%';
    const overGoal = foodData.goal > 0 && foodData.consumed > foodData.goal;

    return (
        <View style={[styles.card, styles.largeCard]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>Food Intake</Text>
                    <Text style={styles.cardSubtitle}>Today's nutrition</Text>
                </View>

                <RingProgress
                    palette={palette}
                    size={96}
                    thickness={8}
                    progress={progress}
                    centerTop={`${foodData.consumed} kcal`}
                    centerBottom={foodData.goal ? `of ${foodData.goal}` : ''}
                />
            </View>

            {/* Macronutrients */}
            {loading ? (
                <View style={[styles.foodRow, { justifyContent: 'center' }]}>
                    <ActivityIndicator color={palette.primary} />
                </View>
            ) : (
                <View style={{ marginTop: 12, gap: 10 }}>
                    <MacroRow
                        label="Protein"
                        value={foodData.protein.consumed}
                        goal={foodData.protein.goal}
                        palette={palette}
                    />
                    <MacroRow
                        label="Carbs"
                        value={foodData.carbs.consumed}
                        goal={foodData.carbs.goal}
                        palette={palette}
                    />
                    <MacroRow
                        label="Fat"
                        value={foodData.fat.consumed}
                        goal={foodData.fat.goal}
                        palette={palette}
                    />
                    <MacroRow
                        label={overGoal ? 'Over goal' : 'Remaining kcal'}
                        value={overGoal ? Math.abs(foodData.goal - foodData.consumed) : remaining}
                        goal={overGoal ? undefined : foodData.goal}
                        palette={palette}
                        highlight={!overGoal}
                    />
                </View>
            )}
        </View>
    );
};

const RingProgress: React.FC<{
    palette: Palette;
    size?: number;
    thickness?: number;
    progress: number;
    centerTop: string;
    centerBottom?: string;
}> = ({ palette, size = 78, thickness = 7, progress, centerTop, centerBottom }) => {
    const clamped = Math.max(0, Math.min(progress, 1));
    const radius = (size - thickness) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - clamped);
    const innerSize = size - thickness * 2.4;

    return (
        <View style={{ alignItems: 'center' }}>
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
                style={{
                    position: 'absolute',
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerSize / 2,
                    backgroundColor: palette.card100,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                    transform: [{ translateY: 11 }],
                }}
            >
                <Text style={{ fontSize: 13, fontWeight: '700', color: palette.text, textAlign: 'center' }}>
                    {centerTop}
                </Text>
                {centerBottom ? (
                    <Text style={{ fontSize: 11, color: palette.subText, textAlign: 'center' }}>{centerBottom}</Text>
                ) : null}
                <Text style={{ fontSize: 10, color: palette.subText, marginTop: 2, textAlign: 'center' }}>
                    {Math.round(clamped * 100)}%
                </Text>
            </View>
        </View>
    );
};

const MacroRow: React.FC<{
    label: string;
    value: number;
    goal?: number;
    palette: Palette;
    highlight?: boolean;
}> = ({ label, value, goal, palette, highlight }) => {
    const clampedGoal = goal && goal > 0 ? goal : undefined;
    const progress = clampedGoal ? Math.min(1, Math.max(0, value / clampedGoal)) : 0;
    return (
        <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: palette.text, fontWeight: '600' }}>{label}</Text>
                <Text style={{ color: palette.subText, fontWeight: '600' }}>
                    {value}{clampedGoal ? ` / ${clampedGoal}` : ''}
                </Text>
            </View>
            <View
                style={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: palette.border,
                    overflow: 'hidden',
                }}
            >
                <View
                    style={{
                        height: '100%',
                        width: `${clampedGoal ? Math.round(progress * 100) : 0}%`,
                        backgroundColor: highlight === false ? palette.subText : palette.primary,
                    }}
                />
            </View>
        </View>
    );
};
