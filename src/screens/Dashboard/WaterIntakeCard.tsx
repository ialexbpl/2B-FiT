// src/screens/Dashboard/WaterIntakeCard.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    TouchableWithoutFeedback,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Rect, Defs, ClipPath, LinearGradient, Stop } from 'react-native-svg';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

const GLASS_ML = 250;
const DEFAULT_GOAL_GLASSES = 8; // 2000ml default goal
const STORAGE_KEY_GLASSES = 'water:glasses';
const STORAGE_KEY_GOAL = 'water:goal';
const STORAGE_KEY_DATE = 'water:date';

export const WaterIntakeCard: React.FC<Props> = ({ styles, palette }) => {
    const [glasses, setGlasses] = useState(0);
    const [goalGlasses, setGoalGlasses] = useState(DEFAULT_GOAL_GLASSES);
    const [goalInput, setGoalInput] = useState(String(DEFAULT_GOAL_GLASSES));
    const [goalModalVisible, setGoalModalVisible] = useState(false);

    const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Load stored data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [savedDate, savedGlasses, savedGoal] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEY_DATE),
                    AsyncStorage.getItem(STORAGE_KEY_GLASSES),
                    AsyncStorage.getItem(STORAGE_KEY_GOAL),
                ]);

                // Reset if it's a new day
                if (savedDate !== todayKey) {
                    setGlasses(0);
                    await AsyncStorage.setItem(STORAGE_KEY_DATE, todayKey);
                    await AsyncStorage.setItem(STORAGE_KEY_GLASSES, '0');
                } else if (savedGlasses) {
                    const parsed = Number(savedGlasses);
                    if (Number.isFinite(parsed) && parsed >= 0) {
                        setGlasses(parsed);
                    }
                }

                if (savedGoal) {
                    const parsedGoal = Number(savedGoal);
                    if (Number.isFinite(parsedGoal) && parsedGoal > 0) {
                        setGoalGlasses(parsedGoal);
                        setGoalInput(String(parsedGoal));
                    }
                }
            } catch (error) {
                console.error('Error loading water data:', error);
            }
        };
        loadData();
    }, [todayKey]);

    const addGlass = useCallback(async () => {
        const newGlasses = glasses + 1;
        setGlasses(newGlasses);
        try {
            await AsyncStorage.setItem(STORAGE_KEY_GLASSES, String(newGlasses));
            await AsyncStorage.setItem(STORAGE_KEY_DATE, todayKey);
        } catch (error) {
            console.error('Error saving water data:', error);
        }
    }, [glasses, todayKey]);

    const removeGlass = useCallback(async () => {
        if (glasses <= 0) return;
        const newGlasses = glasses - 1;
        setGlasses(newGlasses);
        try {
            await AsyncStorage.setItem(STORAGE_KEY_GLASSES, String(newGlasses));
        } catch (error) {
            console.error('Error saving water data:', error);
        }
    }, [glasses]);

    const handleSaveGoal = async () => {
        const parsed = Math.max(1, Math.round(Number(goalInput.replace(/\D+/g, '')) || DEFAULT_GOAL_GLASSES));
        setGoalGlasses(parsed);
        setGoalInput(String(parsed));
        await AsyncStorage.setItem(STORAGE_KEY_GOAL, String(parsed));
        setGoalModalVisible(false);
    };

    const progress = goalGlasses > 0 ? Math.min(glasses / goalGlasses, 1) : 0;
    const totalMl = glasses * GLASS_ML;
    const goalMl = goalGlasses * GLASS_ML;

    return (
        <View style={[styles.card, styles.largeCard]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Water Intake</Text>
                    <Text style={styles.cardSubtitle}>Stay hydrated!</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setGoalModalVisible(true)}
                    style={{ padding: 4 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="settings-outline" size={20} color={palette.subText} />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                {/* Glass Visualization */}
                <View style={{ alignItems: 'center', marginRight: 24 }}>
                    <WaterGlass
                        palette={palette}
                        fillPercent={progress}
                        size={100}
                    />
                    <Text style={{ color: palette.subText, fontSize: 12, marginTop: 8 }}>
                        {totalMl} / {goalMl} ml
                    </Text>
                </View>

                {/* Controls and Info */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: palette.text }}>
                        {glasses} / {goalGlasses}
                    </Text>
                    <Text style={{ color: palette.subText, fontSize: 13, marginBottom: 12 }}>
                        glasses ({GLASS_ML}ml each)
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={removeGlass}
                            disabled={glasses <= 0}
                            style={{
                                backgroundColor: glasses > 0 ? palette.border : palette.card,
                                borderRadius: 12,
                                padding: 10,
                                opacity: glasses > 0 ? 1 : 0.5,
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="remove" size={24} color={palette.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={addGlass}
                            style={{
                                backgroundColor: palette.primary,
                                borderRadius: 12,
                                paddingVertical: 10,
                                paddingHorizontal: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="water" size={20} color={palette.onPrimary} />
                            <Text style={{ color: palette.onPrimary, fontWeight: '600' }}>
                                Add Glass
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Glass indicators */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {Array.from({ length: goalGlasses }).map((_, index) => (
                    <View
                        key={index}
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            backgroundColor: index < glasses ? palette.primary : palette.border,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons
                            name={index < glasses ? 'water' : 'water-outline'}
                            size={16}
                            color={index < glasses ? palette.onPrimary : palette.subText}
                        />
                    </View>
                ))}
            </View>

            {/* Goal Setting Modal */}
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
                                Daily Water Goal
                            </Text>
                            <Text style={{ color: palette.subText, marginTop: 6, fontSize: 13 }}>
                                Set your target number of glasses ({GLASS_ML}ml each).
                            </Text>
                            <TextInput
                                value={goalInput}
                                onChangeText={setGoalInput}
                                keyboardType="numeric"
                                placeholder="8"
                                placeholderTextColor={palette.subText}
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
                            <Text style={{ color: palette.subText, fontSize: 12, marginTop: 6 }}>
                                {Number(goalInput.replace(/\D+/g, '')) * GLASS_ML || 0} ml total
                            </Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                                <TouchableOpacity
                                    onPress={() => setGoalModalVisible(false)}
                                    style={{ marginRight: 12 }}
                                >
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
        </View>
    );
};

// Water Glass SVG Component
const WaterGlass: React.FC<{
    palette: Palette;
    fillPercent: number;
    size: number;
}> = ({ palette, fillPercent, size }) => {
    const clampedFill = Math.max(0, Math.min(fillPercent, 1));

    // Glass dimensions relative to size
    const glassWidth = size * 0.7;
    const glassHeight = size;
    const topWidth = glassWidth;
    const bottomWidth = glassWidth * 0.7;
    const wallThickness = 3;

    // Calculate fill height (from bottom)
    const innerHeight = glassHeight - wallThickness * 2 - 10;
    const fillHeight = innerHeight * clampedFill;

    // Center positions
    const centerX = size / 2;
    const startX = centerX - topWidth / 2;

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Defs>
                <LinearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#4FC3F7" stopOpacity={0.9} />
                    <Stop offset="100%" stopColor="#0288D1" stopOpacity={1} />
                </LinearGradient>
                <ClipPath id="glassClip">
                    {/* Trapezoid shape for the glass interior */}
                    <Path
                        d={`
                            M ${startX + wallThickness + 2} ${wallThickness + 5}
                            L ${startX + topWidth - wallThickness - 2} ${wallThickness + 5}
                            L ${centerX + bottomWidth / 2 - wallThickness - 2} ${glassHeight - wallThickness - 5}
                            L ${centerX - bottomWidth / 2 + wallThickness + 2} ${glassHeight - wallThickness - 5}
                            Z
                        `}
                    />
                </ClipPath>
            </Defs>

            {/* Glass outline (trapezoid shape) */}
            <Path
                d={`
                    M ${startX} 0
                    L ${startX + topWidth} 0
                    L ${centerX + bottomWidth / 2} ${glassHeight}
                    L ${centerX - bottomWidth / 2} ${glassHeight}
                    Z
                `}
                fill="none"
                stroke={palette.border}
                strokeWidth={wallThickness}
                strokeLinejoin="round"
            />

            {/* Water fill */}
            {clampedFill > 0 && (
                <Rect
                    x={0}
                    y={glassHeight - fillHeight - wallThickness - 5}
                    width={size}
                    height={fillHeight + 10}
                    fill="url(#waterGradient)"
                    clipPath="url(#glassClip)"
                />
            )}

            {/* Glass shine effect */}
            <Path
                d={`
                    M ${startX + 5} 8
                    L ${startX + 8} 8
                    L ${centerX - bottomWidth / 2 + 8} ${glassHeight - 8}
                    L ${centerX - bottomWidth / 2 + 5} ${glassHeight - 8}
                    Z
                `}
                fill="rgba(255,255,255,0.3)"
            />
        </Svg>
    );
};

export default WaterIntakeCard;
