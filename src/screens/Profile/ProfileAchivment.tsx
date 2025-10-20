import { View, Text } from 'react-native';
import React from 'react';
import { makeProfileStyles } from './ProfileStyles';
import { useTheme } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';


export const ProfileAchivment: React.FC = () => {
    const { palette } = useTheme();
    const styles = React.useMemo(() => makeProfileStyles(palette), [palette]);
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievement</Text>
            <View style={styles.achivmentContainer}>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Steps
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>...auto</Text>
                    </View>
                </View>

                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Weight reduction
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>..auto</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ProfileAchivment;
