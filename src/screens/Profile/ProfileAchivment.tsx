import { View, Text } from 'react-native';
import React, { useCallback, useState } from 'react';
import { makeProfileStyles } from './ProfileStyles';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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

  const loadHighscore = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('steps:highscore');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.steps === 'number' && parsed.steps > 0) {
          setBestSteps({ steps: parsed.steps, date: parsed.date });
        }
      }
      const streakSaved = await AsyncStorage.getItem('steps:streak');
      if (streakSaved) {
        const parsed = JSON.parse(streakSaved);
        if (parsed && typeof parsed.current === 'number') {
          setStreak({ current: parsed.current, best: parsed.best || parsed.current });
        }
      }
      const goalSaved = await AsyncStorage.getItem('steps:goal');
      if (goalSaved) {
        const parsedGoal = Number(goalSaved);
        if (Number.isFinite(parsedGoal) && parsedGoal > 0) {
          setStepGoal(parsedGoal);
        }
      }
    } catch {
      setBestSteps(null);
      setStreak(null);
      setStepGoal(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHighscore();
    }, [loadHighscore])
  );

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
      <Text style={styles.sectionTitle}>Achievements</Text>
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
