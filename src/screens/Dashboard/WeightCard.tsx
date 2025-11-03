// src/screens/Dashboard/WeightCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const WeightCard: React.FC<Props> = ({ styles, palette }) => {
    const currentWeight = 75.2;
    const goalWeight = 70.0;
    const difference = currentWeight - goalWeight;

    return (
        <View style={[styles.card, styles.smallCard]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Weight</Text>
                <Ionicons name="scale" size={20} color={palette.primary} />
            </View>

            <View style={styles.progressContainer}>
                <Text style={styles.weightMain}>{currentWeight} kg</Text>
                <Text style={styles.weightGoal}>Goal: {goalWeight} kg</Text>
                {difference > 0 && (
                    <Text style={styles.weightDifference}>-{difference.toFixed(1)} kg to go</Text>
                )}
            </View>
        </View>
    );
};