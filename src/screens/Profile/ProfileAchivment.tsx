import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useCallback, useState } from 'react';
import { makeProfileStyles } from './ProfileStyles';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const achievements = [
  {
    key: 'steps',
    icon: 'footsteps-outline' as const,
    label: 'Daily steps streak',
    description: 'Two weeks in a row above 10 000 steps.',
    status: 'synced automatically',
  },
  {
    key: 'weight',
    icon: 'trending-down-outline' as const,
    label: 'Weight trend',
    description: 'On track towards your goal weight.',
    status: 'updated weekly',
  },
];

export const ProfileAchivment: React.FC = () => {
  const { palette } = useTheme();
  const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);
  const [bestSteps, setBestSteps] = useState<{ steps: number; date: string } | null>(null);
  const [streak, setStreak] = useState<{ current: number; best: number } | null>(null);
  const [stepGoal, setStepGoal] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadHighscore = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('steps:highscore');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.steps === 'number' && parsed.steps > 0) {
            setBestSteps(prev =>
              prev?.steps === parsed.steps && prev?.date === parsed.date
                ? prev
                : { steps: parsed.steps, date: parsed.date }
            );
        }
      }
      const streakSaved = await AsyncStorage.getItem('steps:streak');
      if (streakSaved) {
        const parsed = JSON.parse(streakSaved);
        if (parsed && typeof parsed.current === 'number') {
            setStreak(prev =>
              prev?.current === parsed.current && prev?.best === (parsed.best || parsed.current)
                ? prev
                : { current: parsed.current, best: parsed.best || parsed.current }
            );
        }
      }
      const goalSaved = await AsyncStorage.getItem('steps:goal');
      if (goalSaved) {
        const parsedGoal = Number(goalSaved);
        if (Number.isFinite(parsedGoal) && parsedGoal > 0) {
            setStepGoal(prev => (prev === parsedGoal ? prev : parsedGoal));
        }
      }
    } catch (e) {
      // keep previous values on error to avoid flicker
    }
  }, []);

  React.useEffect(() => {
    loadHighscore();
  }, [loadHighscore]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHighscore();
    } finally {
      setRefreshing(false);
    }
  }, [loadHighscore]);

  const formattedBestDate =
    bestSteps?.date ? new Date(bestSteps.date).toLocaleDateString() : null;

  const mergedAchievements = achievements.map(item => {
    if (item.key === 'steps') {
      return {
        ...item,
        description: streak
          ? `${streak.current} day${streak.current === 1 ? '' : 's'} hitting your step goal`
          : 'Hit your daily step goal to start a streak.',
        status: streak
          ? `Best streak: ${streak.best} day${streak.best === 1 ? '' : 's'}${stepGoal ? ` • Goal: ${stepGoal.toLocaleString()} steps` : ''}`
          : stepGoal
            ? `Goal: ${stepGoal.toLocaleString()} steps`
            : item.status,
      };
    }
    return item;
  });

  const cards = [
    {
      key: 'best-steps',
      icon: 'trophy-outline' as const,
      label: 'Best steps day',
      description: bestSteps
        ? `${bestSteps.steps.toLocaleString()} steps`
        : 'No steps recorded yet.',
      status: bestSteps && formattedBestDate ? `on ${formattedBestDate}` : 'synced automatically',
    },
    ...mergedAchievements,
  ];

  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          activeOpacity={0.8}
          style={{ paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={palette.subText} />
          ) : (
            <>
              <Icon name="refresh" size={16} color={palette.subText} />
              <Text style={{ color: palette.subText, marginLeft: 6, fontSize: 12 }}>Refresh</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.achievementsList}>
        {cards.map(item => (
          <View key={item.key} style={styles.achievementCard}>
            <View style={[styles.achievementIconWrap, { backgroundColor: `${palette.primary}1A` }]}>
              <Icon name={item.icon} size={22} color={palette.primary} />
            </View>
            <View style={styles.achievementTextWrap}>
              <Text style={styles.achievementTitle}>{item.label}</Text>
              <Text style={styles.achievementDescription}>{item.description}</Text>
              <Text style={[styles.achievementBadge, { color: palette.subText }]}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProfileAchivment;
