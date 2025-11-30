import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { calculateSummary } from "@utils/mealsApi";
import type { FoodItem, LogEntry, MealType } from "@models/MealModel";
import type { NamedStyles } from "../types";

type Props = {
  logs: LogEntry[];
  mealTypes: { id: MealType; label: string }[];
  onDeleteLog: (id: string) => void;
  onAddFromFoods: () => void;
  styles: NamedStyles;
  palette: { text: string; subText: string };
  dangerColor: string;
};

export function DiaryTab({ logs, mealTypes, onDeleteLog, onAddFromFoods, styles, palette, dangerColor }: Props) {
  const summary = calculateSummary(logs);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Calories</Text>
          <Text style={styles.summaryValue}>{summary.calories} kcal</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Protein</Text>
          <Text style={styles.summaryValue}>{summary.protein} g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Carbs</Text>
          <Text style={styles.summaryValue}>{summary.carbs} g</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fat</Text>
          <Text style={styles.summaryValue}>{summary.fat} g</Text>
        </View>
      </View>

      {mealTypes.map((type) => {
        const mealLogs = logs.filter((l) => l.meal_type === type.id);
        const mealCals = mealLogs.reduce((acc, l) => acc + l.calories, 0);

        return (
          <View key={type.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{type.label}</Text>
              <Text style={styles.sectionMeta}>{mealCals} kcal</Text>
            </View>
            {mealLogs.length === 0 ? (
              <Text style={[styles.emptyText, { marginTop: 0, marginBottom: 8, fontSize: 12 }]}>
                No entries yet
              </Text>
            ) : (
              mealLogs.map((log) => (
                <View key={log.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{log.food_name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {log.calories} kcal  P: {log.protein}  C: {log.carbs}  F: {log.fat}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onDeleteLog(log.id)} style={styles.actionBtn}>
                    <MaterialIcons name="close" size={20} color={dangerColor} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={{ alignSelf: "center", padding: 8 }}
              onPress={onAddFromFoods}
            >
              <Text style={{ color: palette.text, fontWeight: "600" }}>+ Add from foods</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}
