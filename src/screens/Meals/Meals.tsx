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
import { FoodLibraryTab } from "./components/FoodLibraryTab";

export default function Meals() {
  const navigation = useNavigation();
  const { palette } = useTheme();
  const styles = useMemo(() => makeMealsStyles(palette), [palette]);
  const { state, actions } = useMealsLogic();

  const {
    activeTab,
    loading,
    logs,
  } = state;

  const {
    setActiveTab,
    handleDeleteLog,
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
        <FoodLibraryTab />
      )}

      <TouchableOpacity
        style={styles.scannerFab}
        onPress={() => navigation.navigate("Scanner" as never)}
        accessibilityLabel="Scan product"
      >
        <MaterialIcons name="qr-code-scanner" size={28} color={palette.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}
