import React, { useState } from "react";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags?: string[]; 
};

export default function Meals() {
  const defaultMeals: Meal[] = [
    {
      id: "1",
      name: "Owsianka z owocami",
      calories: 420,
      protein: 20,
      carbs: 60,
      fat: 10,
      tags: ["vegetarian", "lactose-free"],
    },
    {
      id: "2",
      name: "Kanapka z kurczakiem",
      calories: 380,
      protein: 30,
      carbs: 40,
      fat: 8,
      tags: ["gluten-free"], 
    },
    {
      id: "3",
      name: "Sałatka z ciecierzycą",
      calories: 350,
      protein: 18,
      carbs: 30,
      fat: 12,
      tags: ["vegetarian", "gluten-free", "lactose-free"],
    },
    {
      id: "4",
      name: "Makaron z pesto",
      calories: 560,
      protein: 15,
      carbs: 75,
      fat: 18,
      tags: ["vegetarian"],
    },
    {
      id: "5",
      name: "Ryż z warzywami i tofu",
      calories: 480,
      protein: 25,
      carbs: 60,
      fat: 12,
      tags: ["vegetarian", "gluten-free", "lactose-free"],
    },
    {
      id: "6",
      name: "Omlet z warzywami",
      calories: 300,
      protein: 22,
      carbs: 6,
      fat: 20,
      tags: ["gluten-free"],
    },
    {
      id: "7",
      name: "Sałatka z łososiem",
      calories: 410,
      protein: 28,
      carbs: 8,
      fat: 28,
      tags: ["gluten-free", "lactose-free"],
    },
  ];

  const [meals, setMeals] = useState<Meal[]>(defaultMeals);
  const [modalVisible, setModalVisible] = useState(false);

  const [newMeal, setNewMeal] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

 
  const [targetCalories, setTargetCalories] = useState<string>("2000");
  const [filterVegetarian, setFilterVegetarian] = useState<boolean>(false);
  const [filterGlutenFree, setFilterGlutenFree] = useState<boolean>(false);
  const [filterLactoseFree, setFilterLactoseFree] = useState<boolean>(false);

  const [generatedPlan, setGeneratedPlan] = useState<Meal[] | null>(null);

 
  const sortMeals = () => {
    setMeals([...meals].sort((a, b) => a.calories - b.calories));
  };

 
  const resetMeals = () => {
    setMeals(defaultMeals);
  };

  const addMeal = () => {
    setMeals([
      ...meals,
      {
        id: Math.random().toString(),
        name: newMeal.name || "Nowy posiłek",
        calories: Number(newMeal.calories) || 0,
        protein: Number(newMeal.protein) || 0,
        carbs: Number(newMeal.carbs) || 0,
        fat: Number(newMeal.fat) || 0,
        tags: [], 
      },
    ]);

    setNewMeal({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });

    setModalVisible(false);
  };

  const deleteMeal = (id: string) => {
    setMeals(meals.filter((meal) => meal.id !== id));

    if (generatedPlan) setGeneratedPlan(generatedPlan.filter((m) => m.id !== id));
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

    return reqs.every((r) => tags.includes(r));
  };


  const generateMealPlan = () => {
    const target = Number(targetCalories) || 0;
    if (target <= 0) {
      Alert.alert("Błąd", "Podaj poprawny cel kaloryczny (np. 2000).");
      return;
    }

    const reqs = buildRestrictions();
    let pool = meals.filter((m) => matchesRestrictions(m, reqs));

    if (pool.length === 0) {
      Alert.alert(
        "Brak dopasowań",
        "Brak posiłków spełniających wybrane restrykcje. Spróbuj zmniejszyć restrykcje lub dodaj posiłki."
      );
      return;
    }

   
    pool = [...pool].sort(() => Math.random() - 0.5);

    const plan: Meal[] = [];
    let sum = 0;
  
    for (let i = 0; i < pool.length && sum < target; i++) {
      plan.push(pool[i]);
      sum += pool[i].calories;
     
      if (i === pool.length - 1 && sum < target) {
     
        pool = [...pool].sort(() => Math.random() - 0.5);
        i = -1; 
        if (plan.length > 10) break; 
      }
    }


    if (sum < target) {
      const sortedByCalAsc = [...meals].sort((a, b) => a.calories - b.calories);
      let idx = 0;
      while (sum < target && idx < sortedByCalAsc.length && plan.length < 12) {
        const candidate = sortedByCalAsc[idx++];
        if (matchesRestrictions(candidate, reqs)) {
          plan.push(candidate);
          sum += candidate.calories;
        }
      }
    }

    setGeneratedPlan(plan);
  };

  const clearGeneratedPlan = () => setGeneratedPlan(null);

  // ui
  return (

    <ScrollView style={styles.container}>
      <Text style={styles.title}>Twoje posiłki</Text>

      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.smallBtn} onPress={sortMeals}>
          <Text style={styles.smallBtnText}>Sortuj kcal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallBtn} onPress={resetMeals}>
          <Text style={styles.smallBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: "#6a1b9a" }]}
          onPress={generateMealPlan}
        >
          <Text style={styles.smallBtnText}>Generuj jadłospis</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.generatorBox}>
        <Text style={styles.generatorTitle}>Ustawienia generatora</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Cel kcal:</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            keyboardType="numeric"
            value={targetCalories}
            onChangeText={setTargetCalories}
          />
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.toggle,
              filterVegetarian ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={() => setFilterVegetarian(!filterVegetarian)}
          >
            <Text style={styles.toggleText}>Wegetariańska</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggle,
              filterGlutenFree ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={() => setFilterGlutenFree(!filterGlutenFree)}
          >
            <Text style={styles.toggleText}>Bez glutenu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggle,
              filterLactoseFree ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={() => setFilterLactoseFree(!filterLactoseFree)}
          >
            <Text style={styles.toggleText}>Bez laktozy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Dostępne posiłki</Text>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
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
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
   <View style={styles.qrButton}>
        <MaterialIcons name="qr-code-scanner" size={35} color="#333" />
      </View>
   
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
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
              Suma kalorii:{" "}
              {generatedPlan.reduce((s, m) => s + (m.calories || 0), 0)} kcal
            </Text>

            {generatedPlan.map((m) => (
              <View key={m.id} style={styles.generatedItem}>
                <Text style={styles.mealName}>{m.name}</Text>
                <Text style={styles.mealInfo}>{m.calories} kcal</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.muted}>Brak wygenerowanego planu</Text>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Dodaj posiłek</Text>

            <TextInput
              style={styles.input}
              placeholder="Nazwa posiłku"
              value={newMeal.name}
              onChangeText={(t) => setNewMeal({ ...newMeal, name: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Kalorie"
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={(t) => setNewMeal({ ...newMeal, calories: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Białko (g)"
              keyboardType="numeric"
              value={newMeal.protein}
              onChangeText={(t) => setNewMeal({ ...newMeal, protein: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Węglowodany (g)"
              keyboardType="numeric"
              value={newMeal.carbs}
              onChangeText={(t) => setNewMeal({ ...newMeal, carbs: t })}
            />

            <TextInput
              style={styles.input}
              placeholder="Tłuszcz (g)"
              keyboardType="numeric"
              value={newMeal.fat}
              onChangeText={(t) => setNewMeal({ ...newMeal, fat: t })}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={addMeal}>
              <Text style={styles.saveBtnText}>Zapisz</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Anuluj</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    marginVertical: 12,
  },

  topButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  smallBtn: {
    backgroundColor: "#0077cc",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },

  smallBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  generatorBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  generatorTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    marginRight: 8,
    width: 80,
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },

  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  toggleOn: {
    backgroundColor: "#388e3c",
  },
  toggleOff: {
    backgroundColor: "#e0e0e0",
  },
  toggleText: {
    color: "#fff",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 6,
  },

  mealCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
  },
  mealInfo: {
    fontSize: 13,
    marginTop: 4,
  },
  tagsText: {
    fontSize: 12,
    marginTop: 6,
    color: "#666",
  },

  deleteBtn: {
    backgroundColor: "#ff3333",
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  addButton: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  generatedBox: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 18,
  },
  generatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  generatedTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  clearGenerated: {
    color: "#0077cc",
    fontWeight: "700",
  },
  summaryText: {
    marginTop: 8,
    fontWeight: "700",
  },
  generatedItem: {
    marginTop: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  muted: {
    color: "#888",
    marginTop: 8,
  },

  modalBg: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: 25,
    padding: 16,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelBtn: {
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtnText: {
    color: "#888",
  },
  qrButton: {
  position: "absolute",
  top: 0,          
  right: 25,       
  zIndex: 9999,
  elevation: 10,
  backgroundColor: "white",
  padding: 8,
  borderRadius: 50,
},

});
