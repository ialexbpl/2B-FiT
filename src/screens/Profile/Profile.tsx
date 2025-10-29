import React from "react";
import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { makeProfileStyles } from "./ProfileStyles";
// theme palettes are provided via ThemeContext
import { ProfileAchivment } from "./ProfileAchivment";
import { useTheme } from "../../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useProfile } from "../../context/ProfileContext";
export const Profile: React.FC = () => {
  const { palette } = useTheme();
  const navigation = useNavigation<any>();
  const { age, height, weight, goalWeight, activityLevel, allergies } = useProfile();
  const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);

  const highlightItems = React.useMemo(
    () => [
      {
        key: 'age',
        label: 'Age',
        value: age ? `${age} years` : 'Not set',
        icon: 'calendar-outline',
      },
      {
        key: 'height',
        label: 'Height',
        value: height ? `${height} cm` : 'Not set',
        icon: 'body-outline',
      },
      {
        key: 'weight',
        label: 'Weight',
        value: weight ? `${weight} kg` : 'Not set',
        icon: 'barbell-outline',
      },
      {
        key: 'goalWeight',
        label: 'Target',
        value: goalWeight ? `${goalWeight} kg` : 'Not set',
        icon: 'flag-outline',
      },
      {
        key: 'activityLevel',
        label: 'Activity',
        value: activityLevel ?? 'Choose level',
        icon: 'pulse-outline',
      },
      {
        key: 'allergies',
        label: 'Allergies',
        value: allergies.length ? allergies.join(', ') : 'No allergies',
        icon: 'leaf-outline',
      },
    ],
    [activityLevel, age, allergies, goalWeight, height, weight],
  );

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoGrid}>
            {highlightItems.map(({ key, label, value, icon }) => (
              <View key={key} style={styles.infoCard}>
                <View style={styles.infoIconWrapper}>
                  <Icon name={icon} size={22} color={palette.primary} />
                </View>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={[styles.infoValue, { color: palette.subText }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <ProfileAchivment />
      </ScrollView>
    </View>
  );
};

export default Profile;
