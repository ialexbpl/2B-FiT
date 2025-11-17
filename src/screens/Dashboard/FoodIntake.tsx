// src/screens/Dashboard/FoodIntake.tsx
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';
import { useNutritionTargets } from '@hooks/useNutritionTargets';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const FoodIntake: React.FC<Props> = ({ styles, palette }) => {
    const targets = useNutritionTargets();

    // Placeholder consumed values (0) until intake tracking is implemented.
    // The goal + macro values come from the nutrition calculator.
    const consumedKcal = 0;
    const goalKcal = targets.calories || 0;

    const foodData = useMemo(() => ({
        consumed: consumedKcal,
        goal: goalKcal,
        protein: targets.protein_g || 0,
        carbs: targets.carbs_g || 0,
        fat: targets.fat_g || 0,
    }), [consumedKcal, goalKcal, targets.protein_g, targets.carbs_g, targets.fat_g]);

    const progress = foodData.goal > 0 ? Math.min(1, Math.max(0, foodData.consumed / foodData.goal)) : 0;
    const remaining = Math.max(0, foodData.goal - foodData.consumed);
    const percentText = foodData.goal > 0 ? `${Math.round(progress * 100)}%` : '0%';

    return (
        <View style={[styles.card, styles.largeCard]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>Food Intake</Text>
                    <Text style={styles.cardSubtitle}>Today's nutrition</Text>
                </View>

                {/* Calories progress circle (fills as you reach goal) */}
                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        width: 72,
                        height: 72,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 4,
                    }}>
                        {/* Track */}
                        <View style={{
                            position: 'absolute',
                            width: 72,
                            height: 72,
                            borderRadius: 36,
                            borderWidth: 6,
                            borderColor: palette.border,
                        }} />
                        {/* Progress arcs: right half always, left half only if >50% */}
                        {(() => {
                          if (progress <= 0) return null;
                          const overHalf = progress > 0.5;
                          const progressColor = progress < 1 ? palette.primary : '#FF6B6B';
                          const rightRotation = progress <= 0.5 ? -135 + progress * 360 : 45;
                          const leftRotation = overHalf ? -135 + (progress - 0.5) * 360 : -135;
                          return (
                            <>
                              <View style={{
                                position: 'absolute',
                                width: 72,
                                height: 72,
                                borderRadius: 36,
                                borderWidth: 6,
                                borderColor: progressColor,
                                borderLeftColor: 'transparent',
                                borderBottomColor: 'transparent',
                                transform: [{ rotate: `${rightRotation}deg` }],
                              }} />
                              {overHalf && (
                                <View style={{
                                  position: 'absolute',
                                  width: 72,
                                  height: 72,
                                  borderRadius: 36,
                                  borderWidth: 6,
                                  borderColor: progressColor,
                                  borderLeftColor: 'transparent',
                                  borderBottomColor: 'transparent',
                                  transform: [{ rotate: `${leftRotation}deg` }],
                                }} />
                              )}
                            </>
                          );
                        })()}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: palette.text, textAlign: 'center' }}>
                            {foodData.consumed}
                        </Text>
                        <Text style={{ fontSize: 10, color: palette.subText, marginTop: -2 }}>
                            / {foodData.goal}
                        </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: palette.subText }}>{percentText}</Text>
                </View>
            </View>

            {/* Macronutrients */}
            <View style={styles.foodRow}>
                <View style={styles.foodItem}>
                    <Text style={styles.foodValue}>{foodData.protein}g</Text>
                    <Text style={styles.foodLabel}>Protein</Text>
                </View>
                <View style={styles.foodItem}>
                    <Text style={styles.foodValue}>{foodData.carbs}g</Text>
                    <Text style={styles.foodLabel}>Carbs</Text>
                </View>
                <View style={styles.foodItem}>
                    <Text style={styles.foodValue}>{foodData.fat}g</Text>
                    <Text style={styles.foodLabel}>Fat</Text>
                </View>
                <View style={styles.foodItem}>
                    <Text style={styles.foodValue}>{foodData.goal - foodData.consumed}</Text>
                    <Text style={styles.foodLabel}>Remaining</Text>
                </View>
            </View>
        </View>
    );
};
