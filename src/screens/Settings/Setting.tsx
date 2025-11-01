import React from 'react';
import { ScrollView, View, Text, Pressable, Switch, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SettingProfileInfo from './SettingProfileInfo';
import { makeSettingStyles } from './SettingStyles';




export const Setting: React.FC = () => {
  const navigation = useNavigation();
  const { palette, theme, isDark, toggle } = useTheme();
  const { signOut } = useAuth();
  const styles = React.useMemo(() => makeSettingStyles(palette), [palette]);
  const handleChangeLogin = React.useCallback(() => {
    Alert.alert(
      'Change login',
      'Adjust the username connected with your account to keep your profile up to date.'
    );
  }, []);

  const handleChangePassword = React.useCallback(() => {
    Alert.alert(
      'Change password',
      'Refresh your password regularly to keep your profile secure.'
    );
  }, []);

  return (//added ImageBackground to test 
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      
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



        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} >
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

          <View style={styles.sectionSpacer} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account & Security</Text>
            <Text style={styles.cardSubtitle}>Manage your credentials with quick shortcuts.</Text>

            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonFirst,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleChangeLogin}
                accessibilityRole="button"
                accessibilityLabel="Change login"
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="id-card-outline" size={20} color={palette.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Change Login</Text>
                  <Text style={styles.actionSubtitle}>Update the username used to sign in.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.subText} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={handleChangePassword}
                accessibilityRole="button"
                accessibilityLabel="Change password"
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={palette.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Change Password</Text>
                  <Text style={styles.actionSubtitle}>Set a new password to secure your account.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.subText} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={async () => {
                  try {
                    await signOut();
                  } catch (e: any) {
                    Alert.alert('Sign out failed', e?.message ?? String(e));
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name="log-out-outline" size={20} color={palette.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionTitle}>Sign Out</Text>
                  <Text style={styles.actionSubtitle}>Sign out of your account.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={palette.subText} />
              </Pressable>
            </View>




          </View>
          <View style={styles.sectionSpacer} />
          <View style={styles.card}>
            <SettingProfileInfo palette={palette} layout="inline" />
          </View>
         
        </ScrollView>

      </View>
  );
};

export default Setting;
