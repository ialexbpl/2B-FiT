import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import type { FoodItem } from "@models/MealModel";
import type { NamedStyles } from "../types";

type Props = {
  visible: boolean;
  foods: FoodItem[];
  search: string;
  onSearchChange: (v: string) => void;
  filterVeg: boolean;
  filterGlutenFree: boolean;
  filterLactoseFree: boolean;
  onToggleVeg: () => void;
  onToggleGluten: () => void;
  onToggleLactose: () => void;
  onAdd: (food: FoodItem) => void;
  onClose: () => void;
  styles: NamedStyles;
  palette: { subText: string; text: string; primary: string; onPrimary: string };
};

export function DefaultFoodsModal({
  visible,
  foods,
  search,
  onSearchChange,
  filterVeg,
  filterGlutenFree,
  filterLactoseFree,
  onToggleVeg,
  onToggleGluten,
  onToggleLactose,
  onAdd,
  onClose,
  styles,
  palette,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={[styles.modal, { maxHeight: "85%" }]}>
          <Text style={styles.modalTitle}>Default meals</Text>
          <TextInput
            style={styles.input}
            placeholder="Search..."
            placeholderTextColor={palette.subText}
            value={search}
            onChangeText={onSearchChange}
          />
          <View style={styles.flagsRow}>
            <TouchableOpacity
              style={[styles.flagBtn, filterVeg && styles.flagBtnActive]}
              onPress={onToggleVeg}
            >
              <Text style={[styles.flagText, filterVeg && styles.flagTextActive]}>Vegetarian</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flagBtn, filterGlutenFree && styles.flagBtnActive]}
              onPress={onToggleGluten}
            >
              <Text style={[styles.flagText, filterGlutenFree && styles.flagTextActive]}>Gluten-free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flagBtn, filterLactoseFree && styles.flagBtnActive]}
              onPress={onToggleLactose}
            >
              <Text style={[styles.flagText, filterLactoseFree && styles.flagTextActive]}>Lactose-free</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: "65%" }} showsVerticalScrollIndicator={false}>
            {foods.map((food) => (
              <View key={food.id} style={styles.defaultCard}>
                <View style={styles.defaultCardHeader}>
                  <Text style={styles.defaultCardTitle}>{food.name}</Text>
                  <TouchableOpacity style={styles.defaultAddBtn} onPress={() => onAdd(food)}>
                    <Text style={styles.defaultAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardSubtitle}>
                  {food.calories} kcal | P: {food.protein} | C: {food.carbs} | F: {food.fat}
                </Text>
                <View style={styles.defaultTags}>
                  {food.vegetarian && <Text style={styles.tag}>Veg</Text>}
                  {food.gluten_free && <Text style={styles.tag}>Gluten-free</Text>}
                  {food.lactose_free && <Text style={styles.tag}>Lactose-free</Text>}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
