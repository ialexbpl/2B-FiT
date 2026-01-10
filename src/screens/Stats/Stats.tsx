import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import Calendar from './Calendar/Calendar';
import WeeklyStatsCard from './WeeklyStatsCard';
import { theme } from '../../styles/theme';

export const Stats: React.FC = () => {
  const { palette } = useTheme() as any;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top', 'left', 'right']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.background }}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >


        {/* Calendar section */}
        <View style={{ paddingHorizontal: 5 }}>
          <View
            style={{
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card100 ?? palette.card,
              overflow: 'hidden',
            }}
          >
            <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 }}>
              <Text style={{ color: palette.text, fontSize: 18, fontWeight: '900' }}>Calendar</Text>
              <Text style={{ color: palette.subText, fontSize: 12, marginTop: 2 }}>
                Plan workouts, meals and reminders.
              </Text>
            </View>

            <Calendar />
          </View>
        </View>

        {/* Weekly section */}
        <View style={{paddingHorizontal: 5, marginTop: 14 }}>
          <WeeklyStatsCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Stats;
