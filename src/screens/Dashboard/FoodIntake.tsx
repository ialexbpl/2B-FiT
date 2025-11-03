// src/screens/Dashboard/FoodIntake.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const FoodIntake: React.FC<Props> = ({ styles, palette }) => {
    const foodData = {
        consumed: 1850,
        goal: 2200,
        protein: 120,
        carbs: 210,
        fat: 65,
    };

    const progress = foodData.consumed / foodData.goal;

    return (
        <View style={[styles.card, styles.largeCard]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>Food Intake</Text>
                    <Text style={styles.cardSubtitle}>Today's nutrition</Text>
                </View>

                {/* Calories progress */}
                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 3,
                        borderColor: palette.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 4,
                    }}>
                        <View style={{
                            position: 'absolute',
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            borderWidth: 3,
                            borderColor: progress < 1 ? palette.primary : '#FF6B6B',
                            borderLeftColor: 'transparent',
                            borderBottomColor: 'transparent',
                            transform: [{ rotate: `${progress * 360 - 135}deg` }],
                        }} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: palette.text }}>
                            {foodData.consumed}
                        </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: palette.subText }}>kcal</Text>
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