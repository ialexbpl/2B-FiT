import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Linking, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { fetchGymDetails } from '../../api/gymService';
import { Gym, GymDetailsProps } from '../../models/GymModels';

const { width } = Dimensions.get('window');

export const GymDetailsScreen: React.FC<GymDetailsProps> = ({ gymId, onClose }) => {
  const { palette, theme } = useTheme();
  
  const [gym, setGym] = useState<Gym | null>(null);
 
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; 

    const loadDetails = async () => {
      if (!gymId) {
          if (isMounted) setLoading(false);
          return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchGymDetails(gymId);
        
        if (isMounted) {
            if (data) {
                setGym(data);
            } else {
                setError("Failed to fetch gym data.");
            }
        }
      } catch (err) {
        if (isMounted) setError("An error occurred while fetching data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();

    return () => { isMounted = false; };
  }, [gymId]);

  
  const handleCall = () => gym?.phone_number && Linking.openURL(`tel:${gym.phone_number}`);
  const handleWebsite = () => gym?.website_url && Linking.openURL(gym.website_url.startsWith('http') ? gym.website_url : `https://${gym.website_url}`);
  const handleRoute = () => {
    if (!gym) return;
    const query = encodeURIComponent(`${gym.name} ${gym.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: palette.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    
    
    headerImage: { width: '100%', height: 250 },
    headerOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 100,
        backgroundColor: 'rgba(0,0,0,0.3)', 
    },
    backButton: {
      position: 'absolute', top: 50, left: 20,
      backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8,
      zIndex: 10,
    },

   
    contentContainer: { 
        backgroundColor: palette.background, 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24, 
        marginTop: -24, 
        padding: 20,
        minHeight: 500,
    },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    title: { fontSize: 26, fontWeight: 'bold', color: palette.text, flex: 1, marginRight: 10 },
    
    
    ratingBadge: { 
        backgroundColor: palette.primary, 
        paddingHorizontal: 8, paddingVertical: 4, 
        borderRadius: 8, flexDirection: 'row', alignItems: 'center' 
    },
    ratingText: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginLeft: 4 },
    categoryText: { fontSize: 14, color: palette.subText, marginBottom: 15 },

    
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, paddingHorizontal: 10 },
    actionBtn: { alignItems: 'center', width: 70 },
    actionIconCircle: { 
      width: 44, height: 44, borderRadius: 22, 
      backgroundColor: palette.card,
      borderWidth: 1, borderColor: palette.border, 
      justifyContent: 'center', alignItems: 'center', marginBottom: 8,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2
    },
    actionLabel: { fontSize: 11, color: palette.text, fontWeight: '500' },

    
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: palette.text, marginBottom: 12, marginTop: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    infoIcon: { width: 24, alignItems: 'center', marginRight: 12, marginTop: 2 },
    infoTextContainer: { flex: 1 },
    infoTextMain: { fontSize: 15, color: palette.text, fontWeight: '500' },
    infoTextSub: { fontSize: 13, color: palette.subText, marginTop: 2 },
    
    statusOpen: { color: '#4CAF50', fontWeight: 'bold' },
    statusClosed: { color: '#F44336', fontWeight: 'bold' },
  });

  
  if (loading) {
      return (
          <View style={[styles.container, styles.centerContainer]}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={{ marginTop: 10, color: palette.subText }}>Loading information...</Text>
          </View>
      );
  }

  
  if (error || !gym) {
      return (
          <View style={[styles.container, styles.centerContainer]}>
              <Ionicons name="alert-circle-outline" size={48} color={palette.subText} />
              <Text style={{ marginTop: 10, color: palette.text, fontSize: 16, textAlign: 'center' }}>
                  {error || "No details found for this gym."}
              </Text>
              <TouchableOpacity onPress={onClose} style={{ marginTop: 20, padding: 10 }}>
                  <Text style={{ color: palette.primary, fontWeight: 'bold', fontSize: 16 }}>Back to list</Text>
              </TouchableOpacity>
          </View>
      );
  }

  
  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        
        <View>
            <Image 
                source={{ uri: gym.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48' }} 
                style={styles.headerImage} 
                resizeMode="cover" 
            />
            <View style={styles.headerOverlay} />
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{gym.name}</Text>
                {(gym.rating || 0) > 0 && (
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#fff" />
                        <Text style={styles.ratingText}>{gym.rating}</Text>
                    </View>
                )}
            </View>
            
            <Text style={styles.categoryText}>
                {gym.category || 'Gym'} • {gym.city}
            </Text>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleRoute}>
                    <View style={styles.actionIconCircle}>
                        <Ionicons name="navigate" size={22} color={palette.primary} />
                    </View>
                    <Text style={styles.actionLabel}>Route</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                    <View style={styles.actionIconCircle}>
                        <Ionicons name="call" size={22} color={palette.primary} />
                    </View>
                    <Text style={styles.actionLabel}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <View style={styles.actionIconCircle}>
                        <Ionicons name="bookmark-outline" size={22} color={palette.text} />
                    </View>
                    <Text style={styles.actionLabel}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <View style={styles.actionIconCircle}>
                        <Ionicons name="share-social-outline" size={22} color={palette.text} />
                    </View>
                    <Text style={styles.actionLabel}>Share</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Information</Text>

            <TouchableOpacity style={styles.infoRow} onPress={handleRoute}>
                <View style={styles.infoIcon}><Ionicons name="location-outline" size={24} color={palette.subText} /></View>
                <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTextMain}>{gym.address}</Text>
                    <Text style={styles.infoTextSub}>{gym.city}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.infoRow}>
                <View style={styles.infoIcon}><Ionicons name="time-outline" size={24} color={palette.subText} /></View>
                <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTextMain}>
                        <Text style={styles.statusOpen}>{gym.open_status || 'Open'}</Text>
                        {gym.closing_time && <Text style={{fontWeight: 'normal'}}> • Closes at: {gym.closing_time}</Text>}
                    </Text>
                    <Text style={styles.infoTextSub}>Hours may vary on holidays</Text>
                </View>
            </View>

            {gym.website_url && (
                <TouchableOpacity style={styles.infoRow} onPress={handleWebsite}>
                    <View style={styles.infoIcon}><Ionicons name="globe-outline" size={24} color={palette.subText} /></View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTextMain}>Website</Text>
                        <Text style={styles.infoTextSub} numberOfLines={1}>{gym.website_url}</Text>
                    </View>
                </TouchableOpacity>
            )}

            {gym.phone_number && (
                <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                    <View style={styles.infoIcon}><Ionicons name="call-outline" size={24} color={palette.subText} /></View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTextMain}>{gym.phone_number}</Text>
                        <Text style={styles.infoTextSub}>Phone number</Text>
                    </View>
                </TouchableOpacity>
            )}

        </View>
      </ScrollView>
    </View>
  );
};