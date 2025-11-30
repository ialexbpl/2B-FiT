import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import type { FoodItem, MealType } from "@models/MealModel";
import type { NamedStyles } from "../types";

type Props = {
  visible: boolean;
  selectedFood: FoodItem | null;
  mealTypes: { id: MealType; label: string }[];
  selectedMealType: MealType;
  onSelectMealType: (type: MealType) => void;
  onAdd: () => void;
  onCancel: () => void;
  styles: NamedStyles;
};

export function LogModal({
  visible,
  selectedFood,
  mealTypes,
  selectedMealType,
  onSelectMealType,
  onAdd,
  onCancel,
  styles,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBg}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add to diary</Text>
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            {selectedFood?.name}
          </Text>

          <View style={styles.typeSelector}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeBtn, selectedMealType === type.id && styles.typeBtnActive]}
                onPress={() => onSelectMealType(type.id)}
              >
                <Text style={[styles.typeBtnText, selectedMealType === type.id && styles.typeBtnTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={onAdd}>
            <Text style={styles.btnText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
