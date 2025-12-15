import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { addRecipeToLog } from '@api/recipeService';
import type { Recipe, MealTimeType } from '@models/RecipeModel';

interface AddToDiaryModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
}

const MEAL_OPTIONS: { id: MealTimeType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'second_breakfast', label: 'Second breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'midday_meal', label: 'Midday meal' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

export function AddToDiaryModal({ visible, recipe, onClose }: AddToDiaryModalProps) {
  const { palette } = useTheme();
  const { session } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState<MealTimeType>('breakfast');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const toDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAdd = async () => {
    if (!session?.user?.id || !recipe) return;

    setSaving(true);
    try {
      await addRecipeToLog(
        session.user.id,
        toDateString(selectedDate),
        selectedMeal,
        recipe
      );
      Alert.alert('Success', 'Recipe added to diary!');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to add to diary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: palette.overlay }]}>
        <View style={[styles.modal, { backgroundColor: palette.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Icon name="arrow-back" size={22} color={palette.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: palette.text }]}>Add to diary</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: palette.subText }]}>
            Select the meal and day to which you want to add the recipe
          </Text>

          {/* Meal Selector */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.subText }]}>Meal</Text>
            <View style={[styles.dropdown, { borderColor: palette.border, backgroundColor: palette.card }]}>
              <Text style={[styles.dropdownText, { color: palette.text }]}>
                {MEAL_OPTIONS.find(m => m.id === selectedMeal)?.label}
              </Text>
              <Icon name="chevron-down" size={20} color={palette.subText} />
            </View>
            {/* Meal options */}
            <View style={styles.mealOptions}>
              {MEAL_OPTIONS.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={[
                    styles.mealOption,
                    { borderColor: palette.border },
                    selectedMeal === meal.id && { borderColor: palette.primary, backgroundColor: palette.primary + '10' },
                  ]}
                  onPress={() => setSelectedMeal(meal.id)}
                >
                  <Text
                    style={[
                      styles.mealOptionText,
                      { color: palette.text },
                      selectedMeal === meal.id && { color: palette.primary, fontWeight: '600' },
                    ]}
                  >
                    {meal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: palette.subText }]}>Day</Text>
            <TouchableOpacity
              style={[styles.dateInput, { borderColor: palette.border, backgroundColor: palette.card }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: palette.text }]}>{formatDate(selectedDate)}</Text>
              <Icon name="calendar-outline" size={20} color={palette.subText} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: palette.primary }]}
            onPress={handleAdd}
            disabled={saving}
          >
            <Text style={[styles.addBtnText, { color: palette.onPrimary }]}>
              {saving ? 'Adding...' : 'Add to diary'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 15,
  },
  mealOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  mealOptionText: {
    fontSize: 13,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },
  addBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

