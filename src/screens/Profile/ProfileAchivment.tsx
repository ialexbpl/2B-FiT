import {
    View,
    Text,
} from 'react-native';
import { styles } from './ProfileStyles';
import Icon from 'react-native-vector-icons/Ionicons';


export const ProfileAchivment: React.FC<{ palette: any; isDark: boolean }> = ({
    palette,
    isDark
}) => {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achivment</Text>
            <View style={styles.achivmentContainer}>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" />Najwieksza ilosc krokow dnia
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>15000</Text>
                    </View>
                </View>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Osagniecie za
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>900</Text>
                    </View>
                </View>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Waga:
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>75kg</Text>
                    </View>
                </View>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Cel:
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>Zredukowac wage o 5kg</Text>
                    </View>
                </View>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Poziom aktywnosci:
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>Sredni</Text>
                    </View>
                </View>
                <View style={styles.achivmentBlock}>
                    <Text style={styles.achivmentText}>
                        <Icon name="trophy" size={20} color="#FFD700" /> Alergie:
                    </Text>
                    <View>
                        <Text style={styles.achivmentDescription}>Brak</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ProfileAchivment;