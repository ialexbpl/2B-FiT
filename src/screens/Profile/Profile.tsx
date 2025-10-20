import React from 'react';
import {
  ScrollView,
  View,
  Text,
  useColorScheme,
  Image,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from './ProfileStyles';
import { lightPalette, darkPalette } from '@styles/theme';
import { ProfileInformations } from './ProfileInformations';
import { ProfileAchivment } from './ProfileAchivment';

export const Profile: React.FC = () => {
  const scheme = useColorScheme();
  const palette = scheme === 'light' ? lightPalette : darkPalette;

  return (
    <View>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsIcon}>
            <Icon name="settings-outline" size={26} color={'black'} />
          </TouchableOpacity>
          <Image
            source={{}}
            style={styles.avatar}
          />
          <Text style={styles.name}>Jakub Apostel</Text>
          <Text style={styles.email}>jakub.apostel@gmail.com</Text>
        </View>

        <ProfileInformations palette={palette} isDark={scheme === 'dark'} />

        <ProfileAchivment palette={palette} isDark={scheme === 'dark'} />
      </ScrollView>
    </View>
  );
};

export default Profile;
