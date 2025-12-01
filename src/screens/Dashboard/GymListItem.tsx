
import React from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Gym } from '../../models/GymModels'; 


interface GymListItemProps {
  gym: Gym;
  onPress: (gym: Gym) => void;
}

export const GymListItem: React.FC<GymListItemProps> = ({ gym, onPress }) => {
  const { palette } = useTheme();
  
  const itemStyles = StyleSheet.create({
    item: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
      backgroundColor: palette.card,
    },
    name: {
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
    },
    address: {
      fontSize: 14,
      color: palette.subText,
      marginTop: 4,
    },
  });

  return (
    <TouchableOpacity style={itemStyles.item} onPress={() => onPress(gym)}>
      <Text style={itemStyles.name}>{gym.name}</Text>
      <Text style={itemStyles.address}>{gym.address}, {gym.city}</Text>
    </TouchableOpacity>
  );
};