// src/screens/Dashboard/WeightCard.tsx
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';
import { useProfile } from '@context/ProfileContext';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const WeightCard: React.FC<Props> = ({ styles, palette }) => {
    const { weight, goalWeight } = useProfile();

    const { currentWeight, targetWeight, difference } = useMemo(() => {
        const current = Number.isFinite(Number(weight)) ? Number(weight) : null;
        const target = Number.isFinite(Number(goalWeight)) ? Number(goalWeight) : null;
        return {
            currentWeight: current,
            targetWeight: target,
            difference: current != null && target != null ? current - target : null,
        };
    }, [goalWeight, weight]);

    return (
        <View style={[styles.card, styles.smallCard]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Weight</Text>
                <Ionicons name="scale" size={20} color={palette.primary} />
            </View>

            <View style={styles.progressContainer}>
                <Text style={styles.weightMain}>
                    {currentWeight != null ? `${currentWeight.toFixed(1)} kg` : 'Set your weight'}
                </Text>
                <Text style={styles.weightGoal}>
                    {targetWeight != null ? `Goal: ${targetWeight.toFixed(1)} kg` : 'Set a goal in Profile'}
                </Text>
                {difference != null && difference !== 0 && (
                    <Text style={styles.weightDifference}>
                        {difference > 0
                            ? `-${difference.toFixed(1)} kg to lose`
                            : `+${Math.abs(difference).toFixed(1)} kg to gain`}
                    </Text>
                )}
                {difference === 0 && currentWeight != null && targetWeight != null && (
                    <Text style={styles.weightDifference}>Goal reached 🎉</Text>
                )}
            </View>
        </View>
    );
};
