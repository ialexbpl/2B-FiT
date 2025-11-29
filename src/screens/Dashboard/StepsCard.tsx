import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';
import { useSteps } from '@hooks/useSteps';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const StepsCard: React.FC<Props> = ({ styles, palette }) => {
    const { steps, goal, isAvailable, loading, error, refresh } = useSteps();
    const goalSteps = goal || 10000;
    const progress = goalSteps > 0 ? Math.min(steps / goalSteps, 1) : 0;

    const circleSize = 70;

    return (
        <View style={[styles.card, styles.smallCard]}>
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
                        {/* Progress Circle */}
                        <View style={styles.circleContainer}>
                            <View style={[
                                styles.circleBackground,
                                { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }
                            ]}>
                                <View style={[
                                    styles.circleProgress,
                                    {
                                        width: circleSize,
                                        height: circleSize,
                                        borderRadius: circleSize / 2,
                                        borderColor: palette.primary,
                                        transform: [{ rotate: `${progress * 360 - 135}deg` }]
                                    }
                                ]} />
                                <View style={styles.circleTextContainer}>
                                    <Text style={styles.circlePercentage}>{Math.round(progress * 100)}%</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepsTextContainer}>
                            <Text style={styles.stepsCurrent}>{steps.toLocaleString()}</Text>
                            <Text style={styles.stepsGoal}>of {goalSteps.toLocaleString()}</Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};
