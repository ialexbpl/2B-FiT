// community/CreatePostModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePosts } from '../../../hooks/usePosts';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '@utils/supabase';

type CreatePostModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (postId?: string) => void;
};

type PostType = 'workout' | 'meal' | 'progress' | 'achievement';
const DEFAULT_POST_TYPE: PostType = 'progress';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose, onCreated }) => {
  const { palette } = useTheme();
  const { createPost } = usePosts();
  const { profile } = useAuth();
  
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    calories: undefined as number | undefined,
    duration: undefined as number | undefined,
    distance: undefined as number | undefined,
    weight: undefined as number | undefined,
  });
  const [metricInputs, setMetricInputs] = useState({
    calories: '',
    duration: '', 
    distance: '',
    weight: '',
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      const filename = uri.split('/').pop() || 'image.jpg';
      const fileExt = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `post-images/${Date.now()}.${fileExt}`;

     const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: filename,
        type: `image/${fileExt}`,
      } as any);
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: false
        });
      
      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);
      
      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const confirmMetric = (field: keyof typeof metricInputs) => {
    const value = metricInputs[field];
    if (value.trim() === '') {
      setMetrics(prev => ({ ...prev, [field]: undefined }));
      setMetricInputs(prev => ({ ...prev, [field]: '' }));
      return;
    }

    const numValue = field === 'calories' || field === 'duration' 
      ? parseInt(value) 
      : parseFloat(value);
    
    if (isNaN(numValue)) {
      Alert.alert('Invalid Input', `Please enter a valid number for ${field}`);
      setMetricInputs(prev => ({ ...prev, [field]: '' }));
      return;
    }

    if (numValue <= 0) {
      Alert.alert('Invalid Input', `Please enter a positive number for ${field}`);
      setMetricInputs(prev => ({ ...prev, [field]: '' }));
      return;
    }

    setMetrics(prev => ({ ...prev, [field]: numValue }));
    setMetricInputs(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | undefined;
      
      if (selectedImage) {
        const uploadedUrl = await uploadImage(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const created = await createPost({
        content: content.trim(),
        image_url: imageUrl,
        post_type: DEFAULT_POST_TYPE,
        calories: metrics.calories,
        duration: metrics.duration,
        distance: metrics.distance,
        weight: metrics.weight,
      });

      resetForm();
      onClose();
      if (created?.id) {
        onCreated?.(created.id);
      } else {
        onCreated?.();
      }
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setSelectedImage(null);
    setMetrics({ 
      calories: undefined, 
      duration: undefined, 
      distance: undefined, 
      weight: undefined 
    });
    setMetricInputs({ 
      calories: '', 
      duration: '', 
      distance: '', 
      weight: '' 
    });
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: palette.card100,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: palette.text,
    },
    content: {
      padding: 16,
    },
    textInput: {
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: palette.text,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    imageContainer: {
      marginTop: 16,
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: palette.border,
    },
    addImageButton: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    typeContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 8,
    },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
    },
    metricsContainer: {
      marginTop: 16,
    },
    metricsTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: palette.text,
      marginBottom: 8,
    },
    metricInputContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      gap: 8,
    },
    metricInput: {
      flex: 1,
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: palette.text,
    },
    confirmButton: {
      backgroundColor: palette.primary,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 50,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: palette.onPrimary,
      fontSize: 12,
      fontWeight: '600' as const,
    },
    currentMetrics: {
      marginTop: 12,
      padding: 12,
      backgroundColor: palette.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },
    currentMetricsTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: palette.text,
      marginBottom: 8,
    },
    metricItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: palette.subText,
    },
    metricValue: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: palette.text,
    },
    clearMetricButton: {
      padding: 4,
      marginLeft: 8,
    },
    actions: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
    },
    submitButton: {
      backgroundColor: palette.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    loadingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      onShow={resetForm}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={palette.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Content Input */}
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?... Share your fitness journey!"
              placeholderTextColor={palette.subText}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
            />

            {/* Image Picker */}
            <View style={styles.imageContainer}>
              {selectedImage ? (
                <>
                  <Image source={{ uri: selectedImage }} style={styles.image} />
                  <TouchableOpacity 
                    style={styles.addImageButton}
                    onPress={() => setSelectedImage(null)}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={palette.text} />
                        <Text style={{ color: palette.text, marginLeft: 8 }}>Uploading...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={20} color={palette.text} />
                        <Text style={{ color: palette.text, marginLeft: 8 }}>Remove Image</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={20} color={palette.text} />
                  <Text style={{ color: palette.text, marginLeft: 8 }}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Metrics Inputs with Confirmation */}
            <View style={styles.metricsContainer}>
              <Text style={styles.metricsTitle}>Metrics (optional)</Text>
              
              {/* Calories Input */}
              <View style={styles.metricInputContainer}>
                <TextInput
                  style={styles.metricInput}
                  placeholder="Calories"
                  placeholderTextColor={palette.subText}
                  value={metricInputs.calories}
                  onChangeText={(text) => setMetricInputs(prev => ({ ...prev, calories: text }))}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => confirmMetric('calories')}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>

              {/* Duration Input */}
              <View style={styles.metricInputContainer}>
                <TextInput
                  style={styles.metricInput}
                  placeholder="Duration (min)"
                  placeholderTextColor={palette.subText}
                  value={metricInputs.duration}
                  onChangeText={(text) => setMetricInputs(prev => ({ ...prev, duration: text }))}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => confirmMetric('duration')}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>

              {/* Distance Input */}
              <View style={styles.metricInputContainer}>
                <TextInput
                  style={styles.metricInput}
                  placeholder="Distance (km)"
                  placeholderTextColor={palette.subText}
                  value={metricInputs.distance}
                  onChangeText={(text) => setMetricInputs(prev => ({ ...prev, distance: text }))}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => confirmMetric('distance')}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>

              {/* Weight Input */}
              <View style={styles.metricInputContainer}>
                <TextInput
                  style={styles.metricInput}
                  placeholder="Weight (kg)"
                  placeholderTextColor={palette.subText}
                  value={metricInputs.weight}
                  onChangeText={(text) => setMetricInputs(prev => ({ ...prev, weight: text }))}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => confirmMetric('weight')}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>

              {/* Current Metrics Display */}
              {(metrics.calories || metrics.duration || metrics.distance || metrics.weight) && (
                <View style={styles.currentMetrics}>
                  <Text style={styles.currentMetricsTitle}>Current Metrics:</Text>
                  {metrics.calories && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Calories:</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.metricValue}>{metrics.calories}</Text>
                        <TouchableOpacity 
                          style={styles.clearMetricButton}
                          onPress={() => {
                            setMetrics(prev => ({ ...prev, calories: undefined }));
                            setMetricInputs(prev => ({ ...prev, calories: '' }));
                          }}
                        >
                          <Ionicons name="close-circle" size={16} color={palette.subText} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {metrics.duration && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Duration:</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.metricValue}>{metrics.duration} min</Text>
                        <TouchableOpacity 
                          style={styles.clearMetricButton}
                          onPress={() => {
                            setMetrics(prev => ({ ...prev, duration: undefined }));
                            setMetricInputs(prev => ({ ...prev, duration: '' }));
                          }}
                        >
                          <Ionicons name="close-circle" size={16} color={palette.subText} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {metrics.distance && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Distance:</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.metricValue}>{metrics.distance} km</Text>
                        <TouchableOpacity 
                          style={styles.clearMetricButton}
                          onPress={() => {
                            setMetrics(prev => ({ ...prev, distance: undefined }));
                            setMetricInputs(prev => ({ ...prev, distance: '' }));
                          }}
                        >
                          <Ionicons name="close-circle" size={16} color={palette.subText} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {metrics.weight && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Weight:</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.metricValue}>{metrics.weight} kg</Text>
                        <TouchableOpacity 
                          style={styles.clearMetricButton}
                          onPress={() => {
                            setMetrics(prev => ({ ...prev, weight: undefined }));
                            setMetricInputs(prev => ({ ...prev, weight: '' }));
                          }}
                        >
                          <Ionicons name="close-circle" size={16} color={palette.subText} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: palette.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading || uploading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={palette.onPrimary} />
                ) : (
                  <Text style={[styles.buttonText, { color: palette.onPrimary }]}>
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
