import React, { useMemo } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@context/ThemeContext";
import { theme } from "@styles/theme";
import { makeMealsStyles } from "./MealsStyles";
import { useMealsLogic, MEAL_TYPES } from "./useMealsLogic";
import { MealsHeader } from "./components/MealsHeader";
import { DiaryTab } from "./components/DiaryTab";
import { FoodsTab } from "./components/FoodsTab";
import { FoodFormModal } from "./components/FoodFormModal";
import { DefaultFoodsModal } from "./components/DefaultFoodsModal";
import { LogModal } from "./components/LogModal";

export default function Meals() {
  const navigation = useNavigation();
  const { palette } = useTheme();
  const styles = useMemo(() => makeMealsStyles(palette), [palette]);
  const { state, actions, helpers } = useMealsLogic();

  const {
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
  } = state;

  const {
    setActiveTab,
    setFoodModalVisible,
    setLogModalVisible,
    setDefaultModalVisible,
    setFoodForm,
    setDefaultSearch,
    setDefaultFilterVeg,
    setDefaultFilterGlutenFree,
    setDefaultFilterLactoseFree,
    setSelectedMealType,
    setTargetCalories,
    setFilterVegetarian,
    setFilterGlutenFree,
    setFilterLactoseFree,
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
  } = actions;

  return (
    <View style={styles.screen}>
      <MealsHeader activeTab={activeTab} onChangeTab={setActiveTab} styles={styles} />

      {loading ? (
        <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 40 }} />
      ) : activeTab === "diary" ? (
        <DiaryTab
          logs={logs}
          mealTypes={MEAL_TYPES}
          onDeleteLog={handleDeleteLog}
          onAddFromFoods={() => setActiveTab("foods")}
          styles={styles}
          palette={{ text: palette.text, subText: palette.subText }}
          dangerColor={theme.colors.danger}
        />
      ) : (
        <FoodsTab
          foods={foods}
          generatedPlan={generatedPlan}
          onGenerate={generateMealPlan}
          onClearPlan={clearGeneratedPlan}
          sortMeals={sortMeals}
          resetMeals={resetMeals}
          targetCalories={targetCalories}
          setTargetCalories={setTargetCalories}
          filterVegetarian={filterVegetarian}
          setFilterVegetarian={setFilterVegetarian}
          filterGlutenFree={filterGlutenFree}
          setFilterGlutenFree={setFilterGlutenFree}
          filterLactoseFree={filterLactoseFree}
          setFilterLactoseFree={setFilterLactoseFree}
          onAddFoodPress={() => {
            resetFoodForm();
            setFoodModalVisible(true);
          }}
          onOpenDefaultModal={() => setDefaultModalVisible(true)}
          onOpenLog={openLogModal}
          onEditFood={openEditFood}
          onDeleteFood={handleDeleteFood}
          isDefaultFood={helpers.isDefaultFood}
          styles={styles}
          palette={palette}
          theme={theme}
        />
      )}

      <TouchableOpacity
        style={styles.scannerFab}
        onPress={() => navigation.navigate("Scanner" as never)}
        accessibilityLabel="Skanuj produkt"
      >
        <MaterialIcons name="qr-code-scanner" size={28} color={palette.onPrimary} />
      </TouchableOpacity>

      <DefaultFoodsModal
        visible={defaultModalVisible}
        foods={filteredDefaults}
        search={defaultSearch}
        onSearchChange={setDefaultSearch}
        filterVeg={defaultFilterVeg}
        filterGlutenFree={defaultFilterGlutenFree}
        filterLactoseFree={defaultFilterLactoseFree}
        onToggleVeg={() => setDefaultFilterVeg((p) => !p)}
        onToggleGluten={() => setDefaultFilterGlutenFree((p) => !p)}
        onToggleLactose={() => setDefaultFilterLactoseFree((p) => !p)}
        onAdd={(food) => handleAddDefaultFood(food)}
        onClose={() => setDefaultModalVisible(false)}
        styles={styles}
        palette={palette}
      />

      <FoodFormModal
        visible={foodModalVisible}
        editingFood={editingFood}
        foodForm={foodForm}
        onChange={(key, value) => setFoodForm((prev: any) => ({ ...prev, [key]: value }))}
        onSave={handleSaveFood}
        onCancel={() => setFoodModalVisible(false)}
        styles={styles}
        palette={palette}
      />

      <LogModal
        visible={logModalVisible}
        selectedFood={selectedFoodForLog}
        mealTypes={MEAL_TYPES}
        selectedMealType={selectedMealType}
        onSelectMealType={setSelectedMealType}
        onAdd={handleAddToLog}
        onCancel={() => setLogModalVisible(false)}
        styles={styles}
      />
    </View>
  );
}
