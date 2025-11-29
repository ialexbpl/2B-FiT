import React, { useCallback, useEffect, useMemo, useState } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTheme } from "@context/ThemeContext";
import { theme, type Palette } from "@styles/theme";
import { useAuth } from "@context/AuthContext";
import {
  fetchUserFoods,
  addUserFood,
  deleteUserFood,
  updateUserFood,
  fetchDailyLog,
  addToLog,
  deleteLogEntry,
  calculateSummary
} from "@utils/mealsApi";
import type { FoodItem, LogEntry, MealType } from "@models/MealModel";

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Śniadanie' },
  { id: 'lunch', label: 'Obiad' },
  { id: 'dinner', label: 'Kolacja' },
  { id: 'snack', label: 'Przekąski' },
];

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.text,
      marginBottom: 16,
    },
    tabs: {
      flexDirection: 'row',
      marginBottom: 16,
      backgroundColor: palette.card,
      borderRadius: theme.radius.lg,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: theme.radius.md,
    },
    activeTab: {
      backgroundColor: palette.primary,
    },
    tabText: {
      fontWeight: '600',
      color: palette.subText,
    },
    activeTabText: {
      color: palette.onPrimary,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.text,
    },
    sectionMeta: {
      fontSize: 14,
      color: palette.subText,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: theme.radius.lg,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.text,
    },
    cardSubtitle: {
      fontSize: 13,
      color: palette.subText,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionBtn: {
      padding: 8,
      marginLeft: 8,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      backgroundColor: palette.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalBg: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: "center",
      padding: 24,
    },
    modal: {
      backgroundColor: palette.card100,
      borderRadius: theme.radius.lg,
      padding: 20,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: palette.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    input: {
      backgroundColor: palette.background,
      color: palette.text,
      padding: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 12,
    },
    btn: {
      backgroundColor: palette.primary,
      padding: 14,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      marginTop: 8,
    },
    btnText: {
      color: palette.onPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
    cancelBtn: {
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    cancelBtnText: {
      color: palette.subText,
      fontWeight: "600",
    },
    summaryBox: {
      backgroundColor: palette.card,
      margin: 16,
      padding: 16,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: palette.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      color: palette.subText,
      fontSize: 14,
    },
    summaryValue: {
      color: palette.text,
      fontWeight: '700',
      fontSize: 14,
    },
    emptyText: {
      textAlign: 'center',
      color: palette.subText,
      marginTop: 20,
      fontStyle: 'italic',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    typeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.background,
    },
    typeBtnActive: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    typeBtnText: {
      color: palette.subText,
      fontSize: 13,
    },
    typeBtnTextActive: {
      color: palette.onPrimary,
      fontWeight: '600',
    },
    // --- Restored Styles ---
    topButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    smallBtn: {
      width: "32%",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      alignItems: "center",
      marginBottom: 10,
    },
    smallBtnLast: {
      marginBottom: 0,
    },
    smallBtnText: {
      fontWeight: "600",
      color: palette.text,
      fontSize: 12,
    },
    smallBtnAccent: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    smallBtnAccentText: {
      color: palette.onPrimary,
    },
    generatorBox: {
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: theme.radius.lg,
      padding: 16,
      marginBottom: 20,
    },
    generatorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.text,
      marginBottom: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 12,
    },
    label: {
      color: palette.text,
      fontWeight: "600",
      marginRight: 12,
    },
    toggle: {
      flexBasis: "32%",
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card100,
      marginRight: 10,
      marginBottom: 10,
    },
    toggleLast: {
      marginRight: 0,
    },
    toggleOn: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    toggleText: {
      fontWeight: "600",
      color: palette.text,
      fontSize: 11,
    },
    toggleTextOn: {
      color: palette.onPrimary,
    },
    addButton: {
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: theme.radius.lg,
      backgroundColor: palette.primary,
      alignItems: "center",
    },
    addButtonText: {
      color: palette.onPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    generatedBox: {
      marginTop: 20,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: theme.radius.lg,
      padding: 16,
    },
    generatedHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    generatedTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: palette.text,
    },
    clearGenerated: {
      color: palette.primary,
      fontWeight: "700",
    },
    summaryText: {
      marginTop: 8,
      fontWeight: "700",
      color: palette.text,
    },
    generatedItem: {
      marginTop: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    muted: {
      color: palette.subText,
      marginTop: 8,
    },
    mealName: {
      fontSize: 16,
      fontWeight: "700",
      color: palette.text,
    },
    mealInfo: {
      fontSize: 13,
      marginTop: 4,
      color: palette.text,
    },
  });



export default function Meals() {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { session } = useAuth();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'diary' | 'foods'>('diary');
  const [loading, setLoading] = useState(false);

  // Data
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Modals
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);

  // Form State
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [selectedFoodForLog, setSelectedFoodForLog] = useState<FoodItem | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');

  const userId = session?.user?.id;
  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fetchedFoods, fetchedLogs] = await Promise.all([
        fetchUserFoods(userId),
        fetchDailyLog(userId, today)
      ]);
      setFoods(fetchedFoods);
      setLogs(fetchedLogs);
    } catch (e) {
      console.error(e);
      Alert.alert('Błąd', 'Nie udało się pobrać danych.');
    } finally {
      setLoading(false);
    }
  }, [userId, today]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // --- Handlers: Foods ---

  const handleSaveFood = async () => {
    if (!userId) return;
    if (!foodForm.name.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę posiłku.');
      return;
    }

    const payload = {
      name: foodForm.name.trim(),
      calories: Number(foodForm.calories) || 0,
      protein: Number(foodForm.protein) || 0,
      carbs: Number(foodForm.carbs) || 0,
      fat: Number(foodForm.fat) || 0,
    };

    try {
      if (editingFood) {
        // Edit
        const updated = await updateUserFood(editingFood.id, payload);
        setFoods(prev => prev.map(f => f.id === updated.id ? updated : f));
        Alert.alert('Sukces', 'Posiłek zaktualizowany.');
      } else {
        // Add
        const newFood = await addUserFood(userId, payload);
        setFoods(prev => [...prev, newFood]);
        Alert.alert('Sukces', 'Posiłek dodany.');
      }
      setFoodModalVisible(false);
      resetFoodForm();
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się zapisać posiłku.');
    }
  };

  const handleDeleteFood = async (id: string) => {
    Alert.alert('Usuń', 'Czy na pewno chcesz usunąć ten posiłek?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserFood(id);
            setFoods(prev => prev.filter(f => f.id !== id));
          } catch (e) {
            Alert.alert('Błąd', 'Nie udało się usunąć.');
          }
        }
      }
    ]);
  };

  const openEditFood = (food: FoodItem) => {
    setEditingFood(food);
    setFoodForm({
      name: food.name,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
    });
    setFoodModalVisible(true);
  };

  const resetFoodForm = () => {
    setEditingFood(null);
    setFoodForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  // --- Handlers: Diary ---

  const handleAddToLog = async () => {
    if (!userId || !selectedFoodForLog) return;
    try {
      const entry = await addToLog(userId, today, selectedMealType, selectedFoodForLog);
      setLogs(prev => [...prev, entry]);
      setLogModalVisible(false);
      Alert.alert('Dodano', `Dodano do: ${MEAL_TYPES.find(t => t.id === selectedMealType)?.label}`);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się dodać do dziennika.');
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteLogEntry(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się usunąć wpisu.');
    }
  };

  const openLogModal = (food: FoodItem) => {
    setSelectedFoodForLog(food);
    setLogModalVisible(true);
  };

  // --- Renderers ---

  const renderDiary = () => {
    const summary = calculateSummary(logs);

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.summaryBox}>
          <Text style={[styles.sectionTitle, { marginBottom: 16, textAlign: 'center' }]}>Podsumowanie dnia</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kalorie</Text>
            <Text style={styles.summaryValue}>{summary.calories} kcal</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Białko</Text>
            <Text style={styles.summaryValue}>{summary.protein} g</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Węglowodany</Text>
            <Text style={styles.summaryValue}>{summary.carbs} g</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tłuszcze</Text>
            <Text style={styles.summaryValue}>{summary.fat} g</Text>
          </View>
        </View>

        {MEAL_TYPES.map(type => {
          const mealLogs = logs.filter(l => l.meal_type === type.id);
          const mealCals = mealLogs.reduce((acc, l) => acc + l.calories, 0);

          return (
            <View key={type.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{type.label}</Text>
                <Text style={styles.sectionMeta}>{mealCals} kcal</Text>
              </View>
              {mealLogs.length === 0 ? (
                <Text style={[styles.emptyText, { marginTop: 0, marginBottom: 8, fontSize: 12 }]}>Brak wpisów</Text>
              ) : (
                mealLogs.map(log => (
                  <View key={log.id} style={styles.card}>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{log.food_name}</Text>
                      <Text style={styles.cardSubtitle}>
                        {log.calories} kcal • B: {log.protein} • W: {log.carbs} • T: {log.fat}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)} style={styles.actionBtn}>
                      <MaterialIcons name="close" size={20} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <TouchableOpacity
                style={{ alignSelf: 'center', padding: 8 }}
                onPress={() => {
                  setActiveTab('foods');
                  Alert.alert('Dodaj', 'Wybierz posiłek z listy, aby dodać go do dziennika.');
                }}
              >
                <Text style={{ color: palette.primary, fontWeight: '600' }}>+ Dodaj produkt</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  // --- Old Features: Sorting & Generator ---

  const [targetCalories, setTargetCalories] = useState<string>("2000");
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterGlutenFree, setFilterGlutenFree] = useState(false);
  const [filterLactoseFree, setFilterLactoseFree] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<FoodItem[] | null>(null);

  const sortMeals = () => {
    setFoods(prev => [...prev].sort((a, b) => a.calories - b.calories));
  };

  const resetMeals = () => {
    loadData(); // Re-fetch from DB to reset order
  };

  const matchesRestrictions = (food: FoodItem, reqs: string[]) => {
    if (reqs.length === 0) return true;
    return true; // Placeholder logic as DB doesn't have tags yet
  };

  const generateMealPlan = () => {
    const target = Number(targetCalories) || 0;
    if (target <= 0) {
      Alert.alert("Niepoprawny cel", "Podaj liczbę kalorii większą od zera.");
      return;
    }

    const reqs: string[] = [];
    if (filterVegetarian) reqs.push("vegetarian");
    if (filterGlutenFree) reqs.push("gluten-free");
    if (filterLactoseFree) reqs.push("lactose-free");

    let pool = foods.filter((f) => matchesRestrictions(f, reqs));

    if (pool.length === 0) {
      Alert.alert("Brak dopasowań", "Żaden posiłek nie spełnia wybranych filtrów.");
      return;
    }

    const plan: FoodItem[] = [];
    let sum = 0;
    const safeGuard = pool.length * 3;
    let iterations = 0;

    while (sum < target && iterations < safeGuard) {
      iterations += 1;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!candidate) break;

      plan.push(candidate);
      sum += candidate.calories;

      if (sum >= target) break;
    }

    setGeneratedPlan(plan);
  };

  const clearGeneratedPlan = () => setGeneratedPlan(null);

  const renderFoodsHeader = () => (
    <View>
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.smallBtn} onPress={sortMeals}>
          <Text style={styles.smallBtnText}>Sortuj kcal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={resetMeals}>
          <Text style={styles.smallBtnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallBtn, styles.smallBtnLast, styles.smallBtnAccent]}
          onPress={generateMealPlan}
        >
          <Text style={[styles.smallBtnText, styles.smallBtnAccentText]}>Generuj jadłospis</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.generatorBox}>
        <Text style={styles.generatorTitle}>Ustawienia generatora</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Cel kcal:</Text>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: palette.card100 }]}
            keyboardType="numeric"
            value={targetCalories}
            onChangeText={setTargetCalories}
            placeholder="np. 2000"
            placeholderTextColor={palette.subText}
          />
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.toggle, filterVegetarian ? styles.toggleOn : null]}
            onPress={() => setFilterVegetarian((prev) => !prev)}
          >
            <Text style={[styles.toggleText, filterVegetarian ? styles.toggleTextOn : null]}>Wegetariańska</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, filterGlutenFree ? styles.toggleOn : null]}
            onPress={() => setFilterGlutenFree((prev) => !prev)}
          >
            <Text style={[styles.toggleText, filterGlutenFree ? styles.toggleTextOn : null]}>Bez glutenu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, styles.toggleLast, filterLactoseFree ? styles.toggleOn : null]}
            onPress={() => setFilterLactoseFree((prev) => !prev)}
          >
            <Text style={[styles.toggleText, filterLactoseFree ? styles.toggleTextOn : null]}>Bez laktozy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>Dostępne posiłki</Text>
    </View>
  );

  const renderFoodsFooter = () => (
    <View style={{ paddingBottom: 20 }}>
      <TouchableOpacity style={styles.addButton} onPress={() => { resetFoodForm(); setFoodModalVisible(true); }}>
        <Text style={styles.addButtonText}>+ Dodaj posiłek</Text>
      </TouchableOpacity>

      <View style={styles.generatedBox}>
        <View style={styles.generatedHeader}>
          <Text style={styles.generatedTitle}>Wygenerowany jadłospis</Text>
          <TouchableOpacity onPress={clearGeneratedPlan}>
            <Text style={styles.clearGenerated}>Wyczyść</Text>
          </TouchableOpacity>
        </View>
        {generatedPlan && generatedPlan.length > 0 ? (
          <>
            <Text style={styles.summaryText}>
              Suma kalorii: {generatedPlan.reduce((sum, meal) => sum + (meal.calories || 0), 0)} kcal
            </Text>
            {generatedPlan.map((meal, index) => (
              <View key={`${meal.id}-${index}`} style={styles.generatedItem}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealInfo}>{meal.calories} kcal</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.muted}>Brak wygenerowanego planu</Text>
        )}
      </View>
    </View>
  );

  const renderFoods = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={foods}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={renderFoodsHeader}
        ListFooterComponent={renderFoodsFooter}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak własnych posiłków. Dodaj pierwszy!</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.calories} kcal • B: {item.protein} • W: {item.carbs} • T: {item.fat}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openLogModal(item)} style={styles.actionBtn}>
                <MaterialIcons name="add-circle-outline" size={24} color={palette.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEditFood(item)} style={styles.actionBtn}>
                <MaterialIcons name="edit" size={22} color={palette.subText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteFood(item.id)} style={styles.actionBtn}>
                <MaterialIcons name="delete-outline" size={22} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Posiłki</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'diary' && styles.activeTab]}
            onPress={() => setActiveTab('diary')}
          >
            <Text style={[styles.tabText, activeTab === 'diary' && styles.activeTabText]}>Dziennik</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'foods' && styles.activeTab]}
            onPress={() => setActiveTab('foods')}
          >
            <Text style={[styles.tabText, activeTab === 'foods' && styles.activeTabText]}>Baza Posiłków</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 40 }} />
      ) : (
        activeTab === 'diary' ? renderDiary() : renderFoods()
      )}

      {/* Modal: Add/Edit Food */}
      <Modal visible={foodModalVisible} transparent animationType="slide" onRequestClose={() => setFoodModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editingFood ? 'Edytuj posiłek' : 'Nowy posiłek'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nazwa"
              placeholderTextColor={palette.subText}
              value={foodForm.name}
              onChangeText={t => setFoodForm(prev => ({ ...prev, name: t }))}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Kcal"
                placeholderTextColor={palette.subText}
                keyboardType="numeric"
                value={foodForm.calories}
                onChangeText={t => setFoodForm(prev => ({ ...prev, calories: t }))}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Białko"
                placeholderTextColor={palette.subText}
                keyboardType="numeric"
                value={foodForm.protein}
                onChangeText={t => setFoodForm(prev => ({ ...prev, protein: t }))}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Węgle"
                placeholderTextColor={palette.subText}
                keyboardType="numeric"
                value={foodForm.carbs}
                onChangeText={t => setFoodForm(prev => ({ ...prev, carbs: t }))}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Tłuszcz"
                placeholderTextColor={palette.subText}
                keyboardType="numeric"
                value={foodForm.fat}
                onChangeText={t => setFoodForm(prev => ({ ...prev, fat: t }))}
              />
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleSaveFood}>
              <Text style={styles.btnText}>Zapisz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setFoodModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Add to Diary */}
      <Modal visible={logModalVisible} transparent animationType="fade" onRequestClose={() => setLogModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dodaj do dziennika</Text>
            <Text style={{ textAlign: 'center', marginBottom: 16, color: palette.text }}>
              {selectedFoodForLog?.name}
            </Text>

            <View style={styles.typeSelector}>
              {MEAL_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeBtn, selectedMealType === type.id && styles.typeBtnActive]}
                  onPress={() => setSelectedMealType(type.id)}
                >
                  <Text style={[styles.typeBtnText, selectedMealType === type.id && styles.typeBtnTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleAddToLog}>
              <Text style={styles.btnText}>Dodaj</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
