import type { StyleProp, TextStyle, ViewStyle } from "react-native";

// Helper type for style object produced by StyleSheet.create
export type NamedStyles = {
  [key: string]: StyleProp<ViewStyle | TextStyle>;
};
