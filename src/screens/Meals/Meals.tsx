import React, { useMemo, useState } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
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
} from "react-native";
import { useTheme } from "@context/ThemeContext";
import { theme, type Palette } from "@styles/theme";

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags?: string[];
};

const makeStyles = (palette: Palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      paddingBottom: 160,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.text,
      marginBottom: 16,
    },
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
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: theme.radius.md,
      backgroundColor: palette.card100,
      color: palette.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
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
    },
    toggleTextOn: {
      color: palette.onPrimary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.text,
    },
    sectionSpacing: {
      marginTop: 8,
      marginBottom: 12,
    },
    mealCard: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: theme.radius.lg,
      padding: 16,
      backgroundColor: palette.card,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
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
    tagsText: {
      fontSize: 12,
      marginTop: 6,
      color: palette.subText,
    },
    deleteBtn: {
      marginLeft: 16,
      backgroundColor: theme.colors.danger,
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
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
    emptyList: {
      textAlign: "center",
      marginBottom: 24,
      color: palette.subText,
    },
    footer: {
      paddingBottom: 12,
    },
    qrButton: {
      position: "absolute",
      right: 20,
      bottom: 24,
      backgroundColor: palette.card,
      borderRadius: 28,
      padding: 12,
      borderWidth: 1,
      borderColor: palette.border,
    },
    modalBg: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modal: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: palette.card100,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.text,
      marginBottom: 12,
    },
    saveBtn: {
      backgroundColor: palette.primary,
      borderRadius: theme.radius.md,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 8,
    },
    saveBtnText: {
      color: palette.onPrimary,
      fontWeight: "600",
    },
    cancelBtn: {
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 8,
    },
    cancelBtnText: {
      color: palette.subText,
      fontWeight: "600",
    },
  });

export default function Meals() {
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const placeholderColor = palette.subText;
  const navigation = useNavigation();

  const defaultMeals: Meal[] = [
    { id: "1", name: "Owsianka z owocami", calories: 420, protein: 20, carbs: 60, fat: 10, tags: ["vegetarian", "lactose-free"] },
    { id: "2", name: "Kanapka z kurczakiem", calories: 380, protein: 30, carbs: 40, fat: 8, tags: ["gluten-free"] },
    { id: "3", name: "Sałatka z ciecierzycą", calories: 350, protein: 18, carbs: 30, fat: 12, tags: ["vegetarian", "gluten-free", "lactose-free"] },
    { id: "4", name: "Makaron z pesto", calories: 560, protein: 15, carbs: 75, fat: 18, tags: ["vegetarian"] },
    { id: "5", name: "Ryż z warzywami i tofu", calories: 480, protein: 25, carbs: 60, fat: 12, tags: ["vegetarian", "gluten-free", "lactose-free"] },
    { id: "6", name: "Omlet z warzywami", calories: 300, protein: 22, carbs: 6, fat: 20, tags: ["gluten-free"] },
    { id: "7", name: "Sałatka z łososiem", calories: 410, protein: 28, carbs: 8, fat: 28, tags: ["gluten-free", "lactose-free"] },
  ];

  const [meals, setMeals] = useState<Meal[]>(defaultMeals);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetCalories, setTargetCalories] = useState<string>("2000");
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterGlutenFree, setFilterGlutenFree] = useState(false);
  const [filterLactoseFree, setFilterLactoseFree] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<Meal[] | null>(null);
  const [newMeal, setNewMeal] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const openScanner = () => {
    navigation.navigate("Scanner" as never);
  };

  const buildRestrictions = () => {
    const reqs: string[] = [];
    if (filterVegetarian) reqs.push("vegetarian");
    if (filterGlutenFree) reqs.push("gluten-free");
    if (filterLactoseFree) reqs.push("lactose-free");
    return reqs;
  };

  const matchesRestrictions = (meal: Meal, reqs: string[]) => {
    if (reqs.length === 0) return true;
    const tags = meal.tags ?? [];
    return reqs.every((req) => tags.includes(req));
  };

  const sortMeals = () => {
    setMeals((prev) => [...prev].sort((a, b) => a.calories - b.calories));
  };

  const resetMeals = () => {
    setMeals(defaultMeals);
  };

  const generateMealPlan = () => {
    const target = Number(targetCalories) || 0;
    if (target <= 0) {
      Alert.alert("Niepoprawny cel", "Podaj liczbę kalorii większą od zera.");
      return;
    }

    const reqs = buildRestrictions();
    let pool = meals.filter((meal) => matchesRestrictions(meal, reqs));

    if (pool.length === 0) {
      Alert.alert("Brak dopasowań", "Żaden posiłek nie spełnia wybranych filtrów.");
      return;
    }

    const plan: Meal[] = [];
    let sum = 0;
    const safeGuard = pool.length * 3;
    let iterations = 0;

    while (sum < target && iterations < safeGuard) {
      iterations += 1;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!candidate) {
        break;
      }

      if (matchesRestrictions(candidate, reqs)) {
        plan.push(candidate);
        sum += candidate.calories;
      }

      if (sum >= target || pool.length === 1) {
        break;
      }

      // remove candidate temporarily to avoid selecting it over and over
      pool = pool.filter((m) => m.id !== candidate.id);
      if (pool.length === 0) {
        pool = meals.filter((meal) => matchesRestrictions(meal, reqs));
      }
    }

    setGeneratedPlan(plan);
  };

  const clearGeneratedPlan = () => setGeneratedPlan(null);

  const addMeal = () => {
    if (!newMeal.name.trim()) {
      Alert.alert("Brak nazwy", "Podaj nazwę posiłku.");
      return;
    }

    const calories = Number(newMeal.calories) || 0;
    const protein = Number(newMeal.protein) || 0;
    const carbs = Number(newMeal.carbs) || 0;
    const fat = Number(newMeal.fat) || 0;

    const meal: Meal = {
      id: Date.now().toString(),
      name: newMeal.name.trim(),
      calories,
      protein,
      carbs,
      fat,
    };

    setMeals((prev) => [meal, ...prev]);
    setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setModalVisible(false);
  };

  const deleteMeal = (id: string) => {
    setMeals((prev) => prev.filter((meal) => meal.id !== id));
  };

  const renderMeal = ({ item }: { item: Meal }) => (
    <View style={styles.mealCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.mealName}>{item.name}</Text>
        <Text style={styles.mealInfo}>Kalorie: {item.calories} kcal</Text>
        <Text style={styles.mealInfo}>
          B: {item.protein}g | W: {item.carbs}g | T: {item.fat}g
        </Text>
        <Text style={styles.tagsText}>
          {item.tags?.length ? item.tags.join(" • ") : "Brak tagów"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteMeal(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Usuń posiłek ${item.name}`}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const listHeader = (
    <View>
      <Text style={styles.title}>Twoje posiłki</Text>
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
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            keyboardType="numeric"
            value={targetCalories}
            onChangeText={setTargetCalories}
            placeholder="np. 2000"
            placeholderTextColor={placeholderColor}
          />
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.toggle, filterVegetarian ? styles.toggleOn : null]}
            onPress={() => setFilterVegetarian((prev) => !prev)}
          >
            <Text
              style={[
                styles.toggleText,
                filterVegetarian ? styles.toggleTextOn : null,
              ]}
            >
              Wegetariańska
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, filterGlutenFree ? styles.toggleOn : null]}
            onPress={() => setFilterGlutenFree((prev) => !prev)}
          >
            <Text
              style={[
                styles.toggleText,
                filterGlutenFree ? styles.toggleTextOn : null,
              ]}
            >
              Bez glutenu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, styles.toggleLast, filterLactoseFree ? styles.toggleOn : null]}
            onPress={() => setFilterLactoseFree((prev) => !prev)}
          >
            <Text
              style={[
                styles.toggleText,
                filterLactoseFree ? styles.toggleTextOn : null,
              ]}
            >
              Bez laktozy
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Dostępne posiłki</Text>
    </View>
  );

  const listFooter = (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
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
            {generatedPlan.map((meal) => (
              <View key={meal.id} style={styles.generatedItem}>
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

  return (
    <View style={styles.screen}>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={renderMeal}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={<Text style={styles.emptyList}>Brak posiłków spełniających filtry</Text>}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <View style={styles.qrButton}>
        <Pressable onPress={openScanner} accessibilityLabel="Zeskanuj produkt">
          <MaterialIcons name="qr-code-scanner" size={32} color={palette.text} />
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dodaj posiłek</Text>
            <TextInput
              style={styles.input}
              placeholder="Nazwa posiłku"
              placeholderTextColor={placeholderColor}
              value={newMeal.name}
              onChangeText={(text) => setNewMeal({ ...newMeal, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Kalorie"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={(text) => setNewMeal({ ...newMeal, calories: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Białko (g)"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newMeal.protein}
              onChangeText={(text) => setNewMeal({ ...newMeal, protein: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Węglowodany (g)"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newMeal.carbs}
              onChangeText={(text) => setNewMeal({ ...newMeal, carbs: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Tłuszcze (g)"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={newMeal.fat}
              onChangeText={(text) => setNewMeal({ ...newMeal, fat: text })}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={addMeal}>
              <Text style={styles.saveBtnText}>Zapisz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
