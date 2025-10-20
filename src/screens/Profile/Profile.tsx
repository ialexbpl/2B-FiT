import React from "react";
import {ScrollView,View,Text,Image,TouchableOpacity} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { makeProfileStyles } from "./ProfileStyles";
// theme palettes are provided via ThemeContext
import { ProfileAchivment } from "./ProfileAchivment";
import { useTheme } from "../../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from "../../context/ProfileContext";
import { ImageBackground } from 'react-native';
export const Profile: React.FC = () => {
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const { age, height, weight, goalWeight, activityLevel, allergies } = useProfile();
  const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView style={{ backgroundColor: palette.background }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings-outline" size={26} color={palette.text} />
          </TouchableOpacity>
          {/* Add a simple placeholder to avoid RN source errors */}
          <Image source={require("../../assets/logo.png")} style={styles.avatar} />
          <Text style={styles.name}>Jakub Apostel</Text>
          <Text style={styles.email}>jakub.apostel@gmail.com</Text>
        </View>

        {/* Minimal read-only profile summary in two columns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsText, { marginBottom: 8 }]}>Age: <Text style={[styles.settingsValue, { color: palette.subText }]}>{age ? `${age} years` : '-'}</Text></Text>
              <Text style={[styles.settingsText, { marginBottom: 8 }]}>Weight: <Text style={[styles.settingsValue, { color: palette.subText }]}>{weight ? `${weight} kg` : '-'}</Text></Text>
              <Text style={[styles.settingsText, { marginBottom: 8 }]}>Target: <Text style={[styles.settingsValue, { color: palette.subText }]}>{goalWeight ? `${goalWeight} kg` : '-'}</Text></Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingsText, { marginBottom: 8 }]}>Height: <Text style={[styles.settingsValue, { color: palette.subText }]}>{height ? `${height} cm` : '-'}</Text></Text>
              <Text style={[styles.settingsText, { marginBottom: 8 }]}>Activity: <Text style={[styles.settingsValue, { color: palette.subText }]}>{activityLevel ?? '-'}</Text></Text>
              <Text style={[styles.settingsText, { marginBottom: 8 }]}>Allergies: <Text style={[styles.settingsValue, { color: palette.subText }]}>{allergies.length ? allergies.join(', ') : 'No allergies'}</Text></Text>
            </View>
          </View>
        </View>

        <ProfileAchivment />
      </ScrollView>
    </View>
  );
};

export default Profile;
