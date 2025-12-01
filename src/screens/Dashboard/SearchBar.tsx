// src/screens/Dashboard/SearchBar.tsx
import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
    // ADDED PROPS:
    query: string;
    onSearch: (text: string) => void;
};

export const SearchBar: React.FC<Props> = ({ styles, palette, query, onSearch }) => {
    return (
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={palette.subText} />
            <TextInput
                // Updated placeholder to be more descriptive
                placeholder="Search for a gym by address or city..."
                placeholderTextColor={palette.subText}
                style={styles.searchInput}
                // ADDED EVENT HANDLERS:
                value={query}
                onChangeText={onSearch}
            />
             {/* Optional clear button when query is not empty */}
             {query.length > 0 && (
                 <Ionicons 
                    name="close-circle" 
                    size={20} 
                    color={palette.subText} 
                    onPress={() => onSearch('')} 
                    style={{ marginLeft: 10 }}
                 />
             )}
        </View>
    );
};