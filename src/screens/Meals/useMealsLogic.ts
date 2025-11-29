import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@context/AuthContext";
import {
  fetchUserFoods,
  addUserFood,
  deleteUserFood,
  updateUserFood,
  fetchDailyLog,
  addToLog,
  deleteLogEntry,
  calculateSummary,
} from "@utils/mealsApi";
import type { FoodItem, LogEntry, MealType } from "@models/MealModel";
import { DEFAULT_FOODS } from "@constants/defaultFoods";

export const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "niadanie" },
  { id: "lunch", label: "Obiad" },
  { id: "dinner", label: "Kolacja" },
  { id: "snack", label: "Przekski" },
];

export function useMealsLogic() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const today = new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"diary" | "foods">("diary");
  const [loading, setLoading] = useState(false);

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [defaultModalVisible, setDefaultModalVisible] = useState(false);

  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [foodForm, setFoodForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    vegetarian: false,
    gluten_free: false,
    lactose_free: false,
  });

  const [defaultSearch, setDefaultSearch] = useState("");
  const [defaultFilterVeg, setDefaultFilterVeg] = useState(false);
  const [defaultFilterGlutenFree, setDefaultFilterGlutenFree] = useState(false);
  const [defaultFilterLactoseFree, setDefaultFilterLactoseFree] = useState(false);

  const [selectedFoodForLog, setSelectedFoodForLog] = useState<FoodItem | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");

  const [targetCalories, setTargetCalories] = useState<string>("2000");
  const [filterVegetarian, setFilterVegetarian] = useState(false);
  const [filterGlutenFree, setFilterGlutenFree] = useState(false);
  const [filterLactoseFree, setFilterLactoseFree] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<FoodItem[] | null>(null);

  const isDefaultFood = (food: FoodItem) => food.is_default || food.user_id === "default";

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [fetchedFoods, fetchedLogs] = await Promise.all([
        fetchUserFoods(userId),
        fetchDailyLog(userId, today),
      ]);
      setFoods(fetchedFoods);
      setLogs(fetchedLogs);
    } catch (e) {
      Alert.alert("Bd", "Nie udao si pobra danych.");
    } finally {
      setLoading(false);
    }
  }, [today, userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Foods
  const resetFoodForm = () => {
    setEditingFood(null);
    setFoodForm({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      vegetarian: false,
      gluten_free: false,
      lactose_free: false,
    });
  };

  const handleSaveFood = async () => {
    if (!userId) return;
    if (!foodForm.name.trim()) {
      Alert.alert("Bd", "Podaj nazw posiku.");
      return;
    }

    const payload = {
      name: foodForm.name.trim(),
      calories: Number(foodForm.calories) || 0,
      protein: Number(foodForm.protein) || 0,
      carbs: Number(foodForm.carbs) || 0,
      fat: Number(foodForm.fat) || 0,
      vegetarian: !!foodForm.vegetarian,
      gluten_free: !!foodForm.gluten_free,
      lactose_free: !!foodForm.lactose_free,
    };

    try {
      if (editingFood) {
        if (isDefaultFood(editingFood)) {
          Alert.alert("Info", "Domylnych posikw nie mona edytowa.");
          return;
        }
        const updated = await updateUserFood(editingFood.id, payload);
        setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        Alert.alert("Sukces", "Posiek zaktualizowany.");
      } else {
        const newFood = await addUserFood(userId, payload);
        setFoods((prev) => [...prev, newFood]);
        Alert.alert("Sukces", "Posiek dodany.");
      }
      setFoodModalVisible(false);
      resetFoodForm();
    } catch (e) {
      Alert.alert("Bd", "Nie udao si zapisa posiku.");
    }
  };

  const handleDeleteFood = async (id: string) => {
    const foodToDelete = foods.find((f) => f.id === id);
    if (foodToDelete && isDefaultFood(foodToDelete)) {
      Alert.alert("Info", "Domylnych posikw nie mona usuwa.");
      return;
    }
    Alert.alert("Usu", "Czy na pewno chcesz usun ten posiek?", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usu",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUserFood(id);
            setFoods((prev) => prev.filter((f) => f.id !== id));
          } catch (e) {
            Alert.alert("Bd", "Nie udao si usun.");
          }
        },
      },
    ]);
  };

  const openEditFood = (food: FoodItem) => {
    if (isDefaultFood(food)) {
      Alert.alert("Info", "Domylne posiki s tylko do podgldu.");
      return;
    }
    setEditingFood(food);
    setFoodForm({
      name: food.name,
      calories: String(food.calories),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
      vegetarian: !!food.vegetarian,
      gluten_free: !!food.gluten_free,
      lactose_free: !!food.lactose_free,
    });
    setFoodModalVisible(true);
  };

  const handleAddDefaultFood = async (food: FoodItem) => {
    if (!userId) return;
    const exists = foods.some((f) => f.name.toLowerCase() === food.name.toLowerCase());
    if (exists) {
      Alert.alert("Info", "Masz juz ten posilek w bazie.");
      return;
    }
    try {
      const newFood = await addUserFood(userId, {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        vegetarian: !!food.vegetarian,
        gluten_free: !!food.gluten_free,
        lactose_free: !!food.lactose_free,
      });
      setFoods((prev) => [...prev, newFood]);
      Alert.alert("Dodano", "Posilek zostal dodany do dostepnych.");
    } catch (e) {
      Alert.alert("Blad", "Nie udalo sie dodac posilku.");
    }
  };

  // Diary
  const handleAddToLog = async () => {
    if (!userId || !selectedFoodForLog) return;
    try {
      const entry = await addToLog(userId, today, selectedMealType, selectedFoodForLog);
      setLogs((prev) => [...prev, entry]);
      setLogModalVisible(false);
      Alert.alert("Dodano", `Dodano do: ${MEAL_TYPES.find((t) => t.id === selectedMealType)?.label}`);
    } catch (e) {
      Alert.alert("Bd", "Nie udao si doda do dziennika.");
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteLogEntry(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      Alert.alert("Bd", "Nie udao si usun wpisu.");
    }
  };

  const openLogModal = (food: FoodItem) => {
    setSelectedFoodForLog(food);
    setLogModalVisible(true);
  };

  // Generator
  const matchesRestrictions = (food: FoodItem, reqs: string[]) => {
    if (reqs.length === 0) return true;
    return reqs.every((r) => {
      if (r === "vegetarian") return !!food.vegetarian;
      if (r === "gluten-free") return !!food.gluten_free;
      if (r === "lactose-free") return !!food.lactose_free;
      return true;
    });
  };

  const generateMealPlan = () => {
    const target = Number(targetCalories) || 0;
    if (target <= 0) {
      Alert.alert("Niepoprawny cel", "Podaj liczb kalorii wiksz od zera.");
      return;
    }

    const reqs: string[] = [];
    if (filterVegetarian) reqs.push("vegetarian");
    if (filterGlutenFree) reqs.push("gluten-free");
    if (filterLactoseFree) reqs.push("lactose-free");

    let pool = foods.filter((f) => matchesRestrictions(f, reqs));

    if (pool.length === 0) {
      Alert.alert("Brak dopasowa", "aden posiek nie spenia wybranych filtrw.");
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

  const sortMeals = () => {
    setFoods((prev) => [...prev].sort((a, b) => a.calories - b.calories));
  };

  const resetMeals = () => {
    loadData();
  };

  const filteredDefaults = useMemo(() => {
    const term = defaultSearch.trim().toLowerCase();

    return DEFAULT_FOODS.filter((f) => {
      const matchesSearch = term ? f.name.toLowerCase().includes(term) : true;
      const matchesFlags =
        (!defaultFilterVeg || !!f.vegetarian) &&
        (!defaultFilterGlutenFree || !!f.gluten_free) &&
        (!defaultFilterLactoseFree || !!f.lactose_free);
      return matchesSearch && matchesFlags;
    });
  }, [defaultFilterGlutenFree, defaultFilterLactoseFree, defaultFilterVeg, defaultSearch]);

  const diarySummary = useMemo(() => calculateSummary(logs), [logs]);

  return {
    state: {
      activeTab,
      loading,
      foods,
      logs,
      foodModalVisible,
      logModalVisible,
      defaultModalVisible,
      foodForm,
      editingFood,
      defaultSearch,
      defaultFilterVeg,
      defaultFilterGlutenFree,
      defaultFilterLactoseFree,
      selectedFoodForLog,
      selectedMealType,
      targetCalories,
      filterVegetarian,
      filterGlutenFree,
      filterLactoseFree,
      generatedPlan,
      filteredDefaults,
      diarySummary,
    },
    actions: {
      setActiveTab,
      setFoodModalVisible,
      setLogModalVisible,
      setDefaultModalVisible,
      setFoodForm,
      setDefaultSearch,
      setDefaultFilterVeg,
      setDefaultFilterGlutenFree,
      setDefaultFilterLactoseFree,
      setSelectedFoodForLog,
      setSelectedMealType,
      setTargetCalories,
      setFilterVegetarian,
      setFilterGlutenFree,
      setFilterLactoseFree,
      setGeneratedPlan,
      handleSaveFood,
      handleDeleteFood,
      openEditFood,
      resetFoodForm,
      handleAddDefaultFood,
      handleAddToLog,
      handleDeleteLog,
      openLogModal,
      generateMealPlan,
      clearGeneratedPlan,
      sortMeals,
      resetMeals,
    },
    helpers: {
      isDefaultFood,
    },
  };
}
