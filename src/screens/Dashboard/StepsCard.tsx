import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const StepsCard: React.FC<Props> = ({ styles, palette }) => {
    const currentSteps = 8432;
    const goalSteps = 10000;
    const progress = Math.min(currentSteps / goalSteps, 1);

    const circleSize = 70;
    const strokeWidth = 6;

    return (
        <View style={[styles.card, styles.smallCard]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Steps</Text>
                <Ionicons name="walk" size={20} color={palette.primary} />
            </View>

            <View style={styles.progressContainer}>
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
                    <Text style={styles.stepsCurrent}>{currentSteps.toLocaleString()}</Text>
                    <Text style={styles.stepsGoal}>of {goalSteps.toLocaleString()}</Text>
                </View>
            </View>
        </View>
    );
};