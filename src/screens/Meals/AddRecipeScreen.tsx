import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { createRecipe, uploadRecipeImage } from '@api/recipeService';
import type { MealTimeType, FlavorType } from '@models/RecipeModel';
import { MEAL_TIME_OPTIONS } from '@models/RecipeModel';

interface IngredientForm {
  name: string;
  amount: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export default function AddRecipeScreen() {
  const navigation = useNavigation();
  const { palette } = useTheme();
  const { session, profile } = useAuth();

  // Form state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [preparationSteps, setPreparationSteps] = useState('1. ');
  const [flavorType, setFlavorType] = useState<FlavorType>('savory');
  const [suitableFor, setSuitableFor] = useState<MealTimeType[]>([]);
  const [ingredients, setIngredients] = useState<IngredientForm[]>([]);
  const [saving, setSaving] = useState(false);

  // Ingredient modal state
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState<IngredientForm>({
    name: '',
    amount: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your photos to add a recipe image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleMealTime = (mealTime: MealTimeType) => {
    setSuitableFor((prev) =>
      prev.includes(mealTime)
        ? prev.filter((m) => m !== mealTime)
        : [...prev, mealTime]
    );
  };

  const addIngredient = () => {
    if (!currentIngredient.name.trim() || !currentIngredient.amount.trim()) {
      Alert.alert('Error', 'Please enter ingredient name and amount.');
      return;
    }
    setIngredients((prev) => [...prev, currentIngredient]);
    setCurrentIngredient({
      name: '',
      amount: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
    setShowIngredientForm(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotalNutrition = useCallback(() => {
    return ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + (Number(ing.calories) || 0),
        protein: acc.protein + (Number(ing.protein) || 0),
        carbs: acc.carbs + (Number(ing.carbs) || 0),
        fat: acc.fat + (Number(ing.fat) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [ingredients]);

  const totals = calculateTotalNutrition();

  const canSave = name.trim() && ingredients.length > 0 && suitableFor.length > 0;

  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be logged in to create a recipe.');
      return;
    }

    if (!canSave) {
      Alert.alert('Error', 'Please fill in recipe name, add at least one ingredient, and select suitable meal times.');
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrl: string | undefined;
      if (imageUri) {
        uploadedImageUrl = await uploadRecipeImage(session.user.id, imageUri);
      }

      const username = profile?.full_name || profile?.username || session.user.email?.split('@')[0] || 'User';

      await createRecipe(session.user.id, username, {
        name: name.trim(),
        image_url: uploadedImageUrl,
        prep_time_min: Number(prepTime) || 0,
        preparation_steps: preparationSteps.trim() || undefined,
        flavor_type: flavorType,
        suitable_for: suitableFor,
        ingredients: ingredients.map((ing) => ({
          name: ing.name.trim(),
          amount: ing.amount.trim(),
          calories: Number(ing.calories) || 0,
          protein: Number(ing.protein) || 0,
          carbs: Number(ing.carbs) || 0,
          fat: Number(ing.fat) || 0,
        })),
      });

      // Reset form
      setImageUri(null);
      setName('');
      setPrepTime('');
      setPreparationSteps('1. ');
      setFlavorType('savory');
      setSuitableFor([]);
      setIngredients([]);
      setShowIngredientForm(false);
      setCurrentIngredient({
        name: '',
        amount: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
      });

      Alert.alert('Success', 'Recipe created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create recipe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={22} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: palette.text }]}>Add Recipe</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker */}
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: palette.card100, borderColor: palette.border }]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.imagePickerContent}>
                <View style={[styles.addPhotoBtn, { backgroundColor: palette.primary }]}>
                  <Icon name="add" size={20} color={palette.onPrimary} />
                  <Text style={[styles.addPhotoText, { color: palette.onPrimary }]}>Add photo</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          {/* Recipe Name */}
          <TextInput
            style={[styles.input, { borderColor: palette.border, color: palette.text }]}
            placeholder="Recipe name"
            placeholderTextColor={palette.subText}
            value={name}
            onChangeText={setName}
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          {/* Ingredients Section */}
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Ingredients</Text>
          
          {ingredients.length === 0 ? (
            <TouchableOpacity
              style={[styles.addIngredientBox, { backgroundColor: palette.card100, borderColor: palette.border }]}
              onPress={() => setShowIngredientForm(true)}
            >
              <View style={styles.addIngredientContent}>
                <Icon name="add" size={20} color={palette.text} />
                <Text style={[styles.addIngredientText, { color: palette.text }]}>Add the first ingredient</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.ingredientsList, { backgroundColor: palette.card100, borderColor: palette.border }]}>
              {ingredients.map((ing, index) => (
                <View key={index} style={[styles.ingredientItem, { borderBottomColor: palette.border }]}>
                  <View style={styles.ingredientInfo}>
                    <Text style={[styles.ingredientName, { color: palette.text }]}>{ing.name}</Text>
                    <Text style={[styles.ingredientAmount, { color: palette.subText }]}>{ing.amount}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeIngredient(index)}>
                    <Icon name="close-circle" size={22} color={palette.subText} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addMoreBtn}
                onPress={() => setShowIngredientForm(true)}
              >
                <Icon name="add" size={18} color={palette.primary} />
                <Text style={[styles.addMoreText, { color: palette.primary }]}>Add ingredient</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ingredient Form */}
          {showIngredientForm && (
            <View style={[styles.ingredientForm, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <TextInput
                style={[styles.ingredientInput, { borderColor: palette.border, color: palette.text }]}
                placeholder="Ingredient name"
                placeholderTextColor={palette.subText}
                value={currentIngredient.name}
                onChangeText={(t) => setCurrentIngredient((p) => ({ ...p, name: t }))}
              />
              <TextInput
                style={[styles.ingredientInput, { borderColor: palette.border, color: palette.text }]}
                placeholder="Amount (e.g., 100g, 1 piece)"
                placeholderTextColor={palette.subText}
                value={currentIngredient.amount}
                onChangeText={(t) => setCurrentIngredient((p) => ({ ...p, amount: t }))}
              />
              <View style={styles.nutritionRow}>
                <TextInput
                  style={[styles.nutritionInput, { borderColor: palette.border, color: palette.text }]}
                  placeholder="kcal"
                  placeholderTextColor={palette.subText}
                  keyboardType="numeric"
                  value={currentIngredient.calories}
                  onChangeText={(t) => setCurrentIngredient((p) => ({ ...p, calories: t }))}
                />
                <TextInput
                  style={[styles.nutritionInput, { borderColor: palette.border, color: palette.text }]}
                  placeholder="Protein"
                  placeholderTextColor={palette.subText}
                  keyboardType="numeric"
                  value={currentIngredient.protein}
                  onChangeText={(t) => setCurrentIngredient((p) => ({ ...p, protein: t }))}
                />
                <TextInput
                  style={[styles.nutritionInput, { borderColor: palette.border, color: palette.text }]}
                  placeholder="Carbs"
                  placeholderTextColor={palette.subText}
                  keyboardType="numeric"
                  value={currentIngredient.carbs}
                  onChangeText={(t) => setCurrentIngredient((p) => ({ ...p, carbs: t }))}
                />
                <TextInput
                  style={[styles.nutritionInput, { borderColor: palette.border, color: palette.text }]}
                  placeholder="Fat"
                  placeholderTextColor={palette.subText}
                  keyboardType="numeric"
                  value={currentIngredient.fat}
                  onChangeText={(t) => setCurrentIngredient((p) => ({ ...p, fat: t }))}
                />
              </View>
              <View style={styles.ingredientFormActions}>
                <TouchableOpacity
                  style={[styles.cancelIngredientBtn, { borderColor: palette.border }]}
                  onPress={() => setShowIngredientForm(false)}
                >
                  <Text style={{ color: palette.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addIngredientBtn, { backgroundColor: palette.primary }]}
                  onPress={addIngredient}
                >
                  <Text style={{ color: palette.onPrimary, fontWeight: '600' }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Nutrition Summary */}
          <View style={[styles.nutritionSummary, { backgroundColor: palette.card100, borderColor: palette.border }]}>
            <View style={styles.nutritionSummaryRow}>
              <Text style={[styles.nutritionSummaryLabel, { color: palette.subText }]}>Calories:</Text>
              <Text style={[styles.nutritionSummaryValue, { color: palette.text }]}>{totals.calories} kcal</Text>
            </View>
            <View style={styles.macrosGrid}>
              <View style={styles.macroBox}>
                <Text style={[styles.macroValue, { color: palette.text }]}>{totals.protein}g</Text>
                <Text style={[styles.macroLabel, { color: palette.subText }]}>Protein</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={[styles.macroValue, { color: palette.text }]}>{totals.fat}g</Text>
                <Text style={[styles.macroLabel, { color: palette.subText }]}>Fats</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={[styles.macroValue, { color: palette.text }]}>{totals.carbs}g</Text>
                <Text style={[styles.macroLabel, { color: palette.subText }]}>Carbohydrates</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          {/* Preparation Steps */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.subText }]}>Preparation</Text>
            <TextInput
              style={[styles.textArea, { borderColor: palette.border, color: palette.text }]}
              placeholder="1. First step..."
              placeholderTextColor={palette.subText}
              value={preparationSteps}
              onChangeText={setPreparationSteps}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Time */}
          <TextInput
            style={[styles.input, { borderColor: palette.border, color: palette.text }]}
            placeholder="Time (min)"
            placeholderTextColor={palette.subText}
            keyboardType="numeric"
            value={prepTime}
            onChangeText={setPrepTime}
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          {/* Flavor Type Toggle */}
          <View style={[styles.flavorToggle, { backgroundColor: palette.card100, borderColor: palette.border }]}>
            <TouchableOpacity
              style={[
                styles.flavorBtn,
                flavorType === 'savory' && { backgroundColor: palette.primary },
              ]}
              onPress={() => setFlavorType('savory')}
            >
              <Text
                style={[
                  styles.flavorBtnText,
                  { color: flavorType === 'savory' ? palette.onPrimary : palette.text },
                ]}
              >
                Savory
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.flavorBtn,
                flavorType === 'sweet' && { backgroundColor: palette.primary },
              ]}
              onPress={() => setFlavorType('sweet')}
            >
              <Text
                style={[
                  styles.flavorBtnText,
                  { color: flavorType === 'sweet' ? palette.onPrimary : palette.text },
                ]}
              >
                Sweet
              </Text>
            </TouchableOpacity>
          </View>

          {/* Suitable For */}
          <Text style={[styles.sectionTitle, { color: palette.text, marginTop: 20 }]}>Suitable for:</Text>
          <View style={styles.mealTimeOptions}>
            {MEAL_TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.mealTimeOption,
                  { borderColor: palette.border },
                  suitableFor.includes(option.id) && { borderColor: palette.primary, backgroundColor: palette.primary + '10' },
                ]}
                onPress={() => toggleMealTime(option.id)}
              >
                <View style={[styles.checkbox, { borderColor: palette.border }]}>
                  {suitableFor.includes(option.id) && (
                    <Icon name="checkmark" size={16} color={palette.primary} />
                  )}
                </View>
                <Text style={[styles.mealTimeText, { color: palette.text }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? palette.primary : palette.card100 },
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            <Icon name="checkmark" size={20} color={canSave ? palette.onPrimary : palette.subText} />
            <Text
              style={[
                styles.saveBtnText,
                { color: canSave ? palette.onPrimary : palette.subText },
              ]}
            >
              {saving ? 'Saving...' : 'Save the recipe'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  imagePicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addPhotoText: {
    fontWeight: '600',
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  addIngredientBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
  },
  addIngredientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addIngredientText: {
    fontSize: 14,
  },
  ingredientsList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '500',
  },
  ingredientAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 6,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientForm: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  ingredientInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    textAlign: 'center',
  },
  ingredientFormActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelIngredientBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  addIngredientBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nutritionSummary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  nutritionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nutritionSummaryLabel: {
    fontSize: 14,
    marginRight: 6,
  },
  nutritionSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  macrosGrid: {
    flexDirection: 'row',
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 11,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    minHeight: 100,
  },
  flavorToggle: {
    flexDirection: 'row',
    borderRadius: 30,
    borderWidth: 1,
    padding: 4,
  },
  flavorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: 'center',
  },
  flavorBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealTimeOptions: {
    gap: 10,
  },
  mealTimeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTimeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

