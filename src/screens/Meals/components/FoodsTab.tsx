import React from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { FoodItem } from "@models/MealModel";
import type { NamedStyles } from "../types";

type Props = {
  foods: FoodItem[];
  generatedPlan: FoodItem[] | null;
  onGenerate: () => void;
  onClearPlan: () => void;
  sortMeals: () => void;
  resetMeals: () => void;
  targetCalories: string;
  setTargetCalories: (val: string) => void;
  filterVegetarian: boolean;
  setFilterVegetarian: (val: boolean) => void;
  filterGlutenFree: boolean;
  setFilterGlutenFree: (val: boolean) => void;
  filterLactoseFree: boolean;
  setFilterLactoseFree: (val: boolean) => void;
  onAddFoodPress: () => void;
  onOpenDefaultModal: () => void;
  onOpenLog: (food: FoodItem) => void;
  onEditFood: (food: FoodItem) => void;
  onDeleteFood: (id: string) => void;
  isDefaultFood: (food: FoodItem) => boolean;
  styles: NamedStyles;
  palette: { text: string; subText: string; primary: string; onPrimary: string };
  theme: { colors: { danger: string } };
};

export function FoodsTab({
  foods,
  generatedPlan,
  onGenerate,
  onClearPlan,
  sortMeals,
  resetMeals,
  targetCalories,
  setTargetCalories,
  filterVegetarian,
  setFilterVegetarian,
  filterGlutenFree,
  setFilterGlutenFree,
  filterLactoseFree,
  setFilterLactoseFree,
  onAddFoodPress,
  onOpenDefaultModal,
  onOpenLog,
  onEditFood,
  onDeleteFood,
  isDefaultFood,
  styles,
  palette,
  theme,
}: Props) {
  const renderFoodsHeader = () => (
    <View>
      <View style={styles.topButtons}>
        <TouchableOpacity style={styles.smallBtn} onPress={sortMeals}>
          <Text style={styles.smallBtnText}>Sort by kcal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={resetMeals}>
          <Text style={styles.smallBtnText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallBtn, styles.smallBtnLast, styles.smallBtnAccent]}
          onPress={onGenerate}
        >
          <Text style={[styles.smallBtnText, styles.smallBtnAccentText]}>Generate meal plan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.generatorBox}>
        <Text style={styles.generatorTitle}>Plan generator</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Target kcal:</Text>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            keyboardType="numeric"
            value={targetCalories}
            onChangeText={setTargetCalories}
            placeholder="e.g. 2000"
            placeholderTextColor={palette.subText}
          />
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.toggle, filterVegetarian ? styles.toggleOn : null]}
            onPress={() => setFilterVegetarian(!filterVegetarian)}
          >
            <Text style={[styles.toggleText, filterVegetarian ? styles.toggleTextOn : null]}>Vegetarian</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, filterGlutenFree ? styles.toggleOn : null]}
            onPress={() => setFilterGlutenFree(!filterGlutenFree)}
          >
            <Text style={[styles.toggleText, filterGlutenFree ? styles.toggleTextOn : null]}>Gluten-free</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, styles.toggleLast, filterLactoseFree ? styles.toggleOn : null]}
            onPress={() => setFilterLactoseFree(!filterLactoseFree)}
          >
            <Text style={[styles.toggleText, filterLactoseFree ? styles.toggleTextOn : null]}>Lactose-free</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.addDefaultBtn} onPress={onOpenDefaultModal}>
        <Text style={styles.addDefaultBtnText}>Add default meals</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>Available meals</Text>
    </View>
  );

  const renderFoodsFooter = () => (
    <View style={{ paddingBottom: 20 }}>
      <TouchableOpacity style={styles.addButton} onPress={onAddFoodPress}>
        <Text style={styles.addButtonText}>+ Add meal</Text>
      </TouchableOpacity>

      <View style={styles.generatedBox}>
        <View style={styles.generatedHeader}>
          <Text style={styles.generatedTitle}>Generated plan</Text>
          <TouchableOpacity onPress={onClearPlan}>
            <Text style={styles.clearGenerated}>Clear</Text>
          </TouchableOpacity>
        </View>
        {generatedPlan && generatedPlan.length > 0 ? (
          <>
            <Text style={styles.summaryText}>
              Total calories: {generatedPlan.reduce((sum, meal) => sum + (meal.calories || 0), 0)} kcal
            </Text>
            {generatedPlan.map((meal, index) => (
              <View key={`${meal.id}-${index}`} style={styles.generatedItem}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealInfo}>{meal.calories} kcal</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.muted}>No plan generated yet</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={foods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={renderFoodsHeader}
        ListFooterComponent={renderFoodsFooter}
        ListEmptyComponent={<Text style={styles.emptyText}>No custom meals yet. Add one!</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.calories} kcal | P: {item.protein} | C: {item.carbs} | F: {item.fat}
              </Text>
              {isDefaultFood(item) && <Text style={styles.defaultBadge}>Default</Text>}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onOpenLog(item)} style={styles.actionBtn}>
                <MaterialIcons name="add-circle-outline" size={24} color={palette.primary} />
              </TouchableOpacity>
              {!isDefaultFood(item) && (
                <>
                  <TouchableOpacity onPress={() => onEditFood(item)} style={styles.actionBtn}>
                    <MaterialIcons name="edit" size={22} color={palette.subText} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteFood(item.id)} style={styles.actionBtn}>
                    <MaterialIcons name="delete-outline" size={22} color={theme.colors.danger} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}
