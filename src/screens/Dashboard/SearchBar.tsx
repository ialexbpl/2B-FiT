// src/screens/Dashboard/SearchBar.tsx
import React from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Palette } from '@styles/theme';
import type { Styles } from './DashboardStyles';

type Props = {
    styles: Styles;
    palette: Palette;
    // DODANE PROPSY:
    query: string;
    onSearch: (text: string) => void;
};

export const SearchBar: React.FC<Props> = ({ styles, palette, query, onSearch }) => {
    return (
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={palette.subText} />
            <TextInput
                // Zmieniony placeholder na bardziej adekwatny
                placeholder="Wyszukaj siłownię po adresie lub mieście..."
                placeholderTextColor={palette.subText}
                style={styles.searchInput}
                // DODANE OBSŁUGI ZDARZEŃ:
                value={query}
                onChangeText={onSearch}
            />
             {/* Opcjonalny przycisk czyszczący, jeśli query nie jest puste */}
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