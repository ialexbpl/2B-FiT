import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { NamedStyles } from "../types";

type Props = {
  activeTab: "diary" | "foods";
  onChangeTab: (tab: "diary" | "foods") => void;
  styles: NamedStyles;
};

export function MealsHeader({ activeTab, onChangeTab, styles }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Meals</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "diary" && styles.activeTab]}
          onPress={() => onChangeTab("diary")}
        >
          <Text style={[styles.tabText, activeTab === "diary" && styles.activeTabText]}>Diary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "foods" && styles.activeTab]}
          onPress={() => onChangeTab("foods")}
        >
          <Text style={[styles.tabText, activeTab === "foods" && styles.activeTabText]}>Food Library</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
