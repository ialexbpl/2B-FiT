import { View, Text } from 'react-native';
import React from 'react';
import { makeProfileStyles } from './ProfileStyles';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsList}>
        {achievements.map(item => (
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
