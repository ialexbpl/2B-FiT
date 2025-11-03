import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const SleepChart: React.FC<Props> = ({ styles, palette }) => {
    const sleepData = [
        { day: 'Mon', hours: 7.2 },
        { day: 'Tue', hours: 6.8 },
        { day: 'Wed', hours: 7.5 },
        { day: 'Thu', hours: 6.5 },
        { day: 'Fri', hours: 7.0 },
        { day: 'Sat', hours: 8.2 },
        { day: 'Sun', hours: 7.8 },
    ];

    const maxSleep = Math.max(...sleepData.map(item => item.hours));
    const todaySleep = 7.5;
    const sleepProgress = todaySleep / 8;

    return (
        <View style={[styles.card, styles.largeCard]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>Sleep Quality</Text>
                    <Text style={styles.cardSubtitle}>Last 7 days</Text>
                </View>

                {/* Today's sleep progress */}
                <View style={styles.sleepProgressContainer}>
                    <View style={styles.sleepCircle}>
                        <View style={[
                            styles.sleepCircleProgress,
                            {
                                borderColor: palette.primary,
                                transform: [{ rotate: `${sleepProgress * 360 - 135}deg` }],
                            }
                        ]} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: palette.text }}>
                            {todaySleep}h
                        </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: palette.subText }}>Today</Text>
                </View>
            </View>

            {/* Sleep bars chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chartRow}>
                    {sleepData.map((item, index) => {
                        const barHeight = (item.hours / maxSleep) * 80;
                        return (
                            <View key={index} style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: barHeight,
                                            backgroundColor: item.hours >= 7 ? palette.primary : palette.subText,
                                        }
                                    ]}
                                />
                                <Text style={styles.barLabel}>{item.day}</Text>
                                <Text style={[styles.barLabel, { fontSize: 9 }]}>{item.hours}h</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};