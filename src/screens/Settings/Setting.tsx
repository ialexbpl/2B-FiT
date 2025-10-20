import React from 'react';
import { ScrollView, View, Text, Pressable, Switch, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import SettingProfileInfo from './SettingProfileInfo';
import { makeSettingStyles } from './SettingStyles';


export const Setting: React.FC = () => {
  const navigation = useNavigation();
  const { palette, theme, isDark, toggle } = useTheme();
  const styles = React.useMemo(() => makeSettingStyles(palette), [palette]);

  return (//added ImageBackground to test 
    <View style={{ flex: 1, backgroundColor: palette.background }}>
       <ImageBackground source={palette.backgroundImage} resizeMode="cover" style={{ flex: 1, backgroundColor: palette.background }}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => (navigation as any).navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>



        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flexShrink: 1, paddingRight: 12 }}>
                <Text style={styles.cardTitle}>Dark mode</Text>
                <Text style={styles.cardSubtitle}>Customize app appearance.</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggle}
                thumbColor={'#ffffff'}
                trackColor={{ false: '#d1d5db', true: theme.colors.primary }}
              />
            </View>
          </View>





          <View style={{ paddingVertical: 8 }}>
            <SettingProfileInfo palette={palette} />
          </View>
        </ScrollView>
    
     </ImageBackground>
    </View>//added ImageBackground to test 
  );
};

export default Setting;
