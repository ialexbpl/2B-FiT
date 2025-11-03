// src/screens/Dashboard/SearchBar.tsx
import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
};

export const SearchBar: React.FC<Props> = ({ styles, palette }) => {
    return (
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={palette.subText} />
            <TextInput
                placeholder="Search for meals, workouts..."
                placeholderTextColor={palette.subText}
                style={styles.searchInput}
            />
        </View>
    );
};