import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@context/ThemeContext';
import { makeDashboardStyles } from './DashboardStyles';
import { SearchBar } from './SearchBar';
import { StepsCard } from './StepsCard';
import { WeightCard } from './WeightCard';
import { SleepChart } from './SleepChart';
import { FoodIntake } from './FoodIntake';

export const Dashboard: React.FC = () => {
    const { palette, theme } = useTheme();
    const styles = useMemo(() => makeDashboardStyles(palette, theme), [palette, theme]);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <SearchBar styles={styles} palette={palette} />

                {/* Stats Cards Row */}
                <View style={styles.statsRow}>
                    <StepsCard styles={styles} palette={palette} />
                    <WeightCard styles={styles} palette={palette} />
                </View>

                {/* Sleep Chart */}
                <SleepChart styles={styles} palette={palette} />

                {/* Food Intake */}
                <FoodIntake styles={styles} palette={palette} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default Dashboard;