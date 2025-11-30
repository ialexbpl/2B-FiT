import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import type { FoodItem } from "@models/MealModel";
import type { NamedStyles } from "../types";

type Props = {
  visible: boolean;
  editingFood: FoodItem | null;
  foodForm: {
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    vegetarian: boolean;
    gluten_free: boolean;
    lactose_free: boolean;
  };
  onChange: (key: string, value: string | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  styles: NamedStyles;
  palette: { subText: string; text: string; onPrimary: string };
};

export function FoodFormModal({
  visible,
  editingFood,
  foodForm,
  onChange,
  onSave,
  onCancel,
  styles,
  palette,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{editingFood ? "Edit meal" : "New meal"}</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor={palette.subText}
            value={foodForm.name}
            onChangeText={(t) => onChange("name", t)}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Kcal"
              placeholderTextColor={palette.subText}
              keyboardType="numeric"
              value={foodForm.calories}
              onChangeText={(t) => onChange("calories", t)}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Protein"
              placeholderTextColor={palette.subText}
              keyboardType="numeric"
              value={foodForm.protein}
              onChangeText={(t) => onChange("protein", t)}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Carbs"
              placeholderTextColor={palette.subText}
              keyboardType="numeric"
              value={foodForm.carbs}
              onChangeText={(t) => onChange("carbs", t)}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Fat"
              placeholderTextColor={palette.subText}
              keyboardType="numeric"
              value={foodForm.fat}
              onChangeText={(t) => onChange("fat", t)}
            />
          </View>
          <View style={styles.flagsRow}>
            <TouchableOpacity
              style={[styles.flagBtn, foodForm.vegetarian && styles.flagBtnActive]}
              onPress={() => onChange("vegetarian", !foodForm.vegetarian)}
            >
              <Text style={[styles.flagText, foodForm.vegetarian && styles.flagTextActive]}>Vegetarian</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flagBtn, foodForm.gluten_free && styles.flagBtnActive]}
              onPress={() => onChange("gluten_free", !foodForm.gluten_free)}
            >
              <Text style={[styles.flagText, foodForm.gluten_free && styles.flagTextActive]}>Gluten-free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flagBtn, foodForm.lactose_free && styles.flagBtnActive]}
              onPress={() => onChange("lactose_free", !foodForm.lactose_free)}
            >
              <Text style={[styles.flagText, foodForm.lactose_free && styles.flagTextActive]}>Lactose-free</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btn} onPress={onSave}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
