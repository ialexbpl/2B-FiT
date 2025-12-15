import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  BarcodeType,
} from "expo-camera";
import {
  fetchProductByBarcode,
  fetchProductByName,
  Product,
} from "../../../api/OpenFoodFacts";
import { getScannerStyles } from "./ScannerStyles";
import { useTheme } from "../../../context/ThemeContext";

import { useAuth } from "@context/AuthContext";
import { addToLog } from "@utils/mealsApi";
import type { FoodItem, MealType } from "@models/MealModel";
import { MEAL_TYPES } from "../useMealsLogic";

function safeNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function gramsToPortionMultiplier(grams: number) {
  return grams / 100;
}

function productToFoodItem(product: Product, grams: number): FoodItem {
  const m = gramsToPortionMultiplier(grams);

  const calories = safeNumber(product.caloriesPer100g) * m;
  const protein = safeNumber(product.proteinsPer100g) * m;
  const carbs = safeNumber(product.carbsPer100g) * m;
  const fat = safeNumber(product.fatPer100g) * m;

  return {
    id: `scan-${Date.now()}`,
    name: product.name || "Scanned product",
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    vegetarian: false,
    gluten_free: false,
    lactose_free: false,
  } as unknown as FoodItem;
}

export default function Scanner() {
  const navigation = useNavigation();
  const { palette } = useTheme();
  const styles = getScannerStyles(palette);

  const { session } = useAuth();
  const userId = session?.user?.id;
  const today = new Date().toISOString().split("T")[0];

  const [permission, requestPermission] = useCameraPermissions();
  const [enabled, setEnabled] = useState(true);
  const [last, setLast] = useState<BarcodeScanningResult | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showProductFull, setShowProductFull] = useState(false);

  const [grams, setGrams] = useState<string>("100");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [adding, setAdding] = useState(false);

  const settings: { barcodeTypes: BarcodeType[] } = useMemo(
    () => ({
      barcodeTypes: ["ean13", "ean8", "code128", "qr"] as BarcodeType[],
    }),
    []
  );

  const loadProductByCode = useCallback(async (code: string) => {
    setLoadingProduct(true);
    setProductError(null);
    setProduct(null);
    setShowProductFull(false);

    const result = await fetchProductByBarcode(code);

    if (!result) {
      setProductError("No product found for this barcode.");
    } else {
      setProduct(result);
      setShowProductFull(true);
    }

    setLoadingProduct(false);
  }, []);

  const loadProductByName = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setEnabled(false);
    setLoadingProduct(true);
    setProductError(null);
    setProduct(null);
    setShowProductFull(false);

    try {
      const result = await fetchProductByName(query);
      if (!result) {
        setProductError("No product found with this name.");
      } else {
        setProduct(result);
        setShowProductFull(true);
      }
    } catch (e) {
      setProductError("An error occurred while searching for the product.");
    } finally {
      setLoadingProduct(false);
    }
  }, [searchQuery]);

  const handleScan = useCallback(
    (res: BarcodeScanningResult) => {
      if (!enabled) return;

      setEnabled(false);
      setLast(res);

      if (res.data) {
        loadProductByCode(res.data.toString());
      }
    },
    [enabled, loadProductByCode]
  );

  const handleReset = () => {
    setEnabled(true);
    setLast(null);
    setProduct(null);
    setProductError(null);
    setShowProductFull(false);
    setSearchQuery("");
    setGrams("100");
    setMealType("breakfast");
    setAdding(false);
  };

  function getNutriScoreColor(score?: string): string {
    if (!score) return palette.text;
    const s = score.toLowerCase();
    switch (s) {
      case "a":
        return "#2ecc71";
      case "b":
        return "#a3d977";
      case "c":
        return "#f1c40f";
      case "d":
        return "#e67e22";
      case "e":
        return "#e74c3c";
      default:
        return palette.text;
    }
  }

  const portionPreview = useMemo(() => {
    if (!product) return null;
    const g = safeNumber(grams);
    if (g <= 0) return null;

    const m = gramsToPortionMultiplier(g);

    return {
      kcal: Math.round(safeNumber(product.caloriesPer100g) * m),
      protein: Math.round(safeNumber(product.proteinsPer100g) * m * 10) / 10,
      carbs: Math.round(safeNumber(product.carbsPer100g) * m * 10) / 10,
      fat: Math.round(safeNumber(product.fatPer100g) * m * 10) / 10,
    };
  }, [product, grams]);

  const handleAddToDiary = useCallback(async () => {
    if (!userId) {
      Alert.alert("Not logged in", "You need to be logged in to add meals.");
      return;
    }
    if (!product) return;

    const g = safeNumber(grams);
    if (!Number.isFinite(g) || g <= 0) {
      Alert.alert("Invalid amount", "Enter a valid grams amount (e.g. 50, 120).");
      return;
    }

    try {
      setAdding(true);
      const food = productToFoodItem(product, g);
      await addToLog(userId, today, mealType, food);

      Alert.alert("Added", `Added to: ${MEAL_TYPES.find((t) => t.id === mealType)?.label}`);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Failed to add scanned product to diary.");
    } finally {
      setAdding(false);
    }
  }, [userId, product, grams, mealType, today, navigation]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>I need camera access to scan barcodes.</Text>
        <Text style={styles.permissionText}>Camera data is never sent anywhere outside your app.</Text>

        <Text onPress={requestPermission} style={styles.permissionButtonText}>
          Grant permission
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
        <MaterialIcons name="arrow-back" size={26} color={palette.onPrimary} />
      </Pressable>

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={settings}
        onBarcodeScanned={handleScan}
      />

      {product && showProductFull ? (
        <View style={styles.fullProductWrapper}>
          <ScrollView contentContainerStyle={styles.fullProductContent} showsVerticalScrollIndicator={false}>
          <View style={styles.productHeroCard}>
            {product.imageUrl && (
              <Image source={{ uri: product.imageUrl }} style={styles.productHeroImage} />
            )}

            <View style={styles.productHeroContent}>
              {product.brand && (
                <View style={styles.brandBadge}>
                  <Text style={styles.brandBadgeText}>{product.brand}</Text>
                </View>
              )}

              <Text style={styles.productHeroTitle}>{product.name}</Text>

              <View style={styles.productMetaRow}>
                {product.caloriesPer100g != null && (
                  <View style={styles.kcalBadge}>
                    <Text style={styles.kcalBadgeText}>
                      🔥 {product.caloriesPer100g} kcal / 100g
                    </Text>
                  </View>
                )}

                {product.quantity && (
                  <Text style={styles.productQuantity}>
                    📦 {product.quantity}
                  </Text>
                )}
              </View>

              {product.nutrigrade && (
                <View
                  style={[
                    styles.nutriChip,
                    { backgroundColor: getNutriScoreColor(product.nutrigrade) + "22" },
                  ]}
                >
                  <Text
                    style={[
                      styles.nutriChipText,
                      { color: getNutriScoreColor(product.nutrigrade) },
                    ]}
                  >
                    Nutri-Score {product.nutrigrade.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>


            <View style={styles.portionCard}>
              <Text style={styles.portionTitle}>Add to diary</Text>

              <View style={styles.portionRow}>
                <Text style={styles.portionLabel}>Amount (g)</Text>
                <TextInput
                  value={grams}
                  onChangeText={(t) => setGrams(t.replace(",", "."))}
                  keyboardType="numeric"
                  placeholder="e.g. 120"
                  placeholderTextColor={palette.subText}
                  style={styles.portionInput}
                />
              </View>

              <Text style={styles.portionLabel}>Meal</Text>
              <View style={styles.mealChipsRow}>
                {MEAL_TYPES.map((t) => {
                  const active = t.id === mealType;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setMealType(t.id)}
                      style={[styles.mealChip, active && styles.mealChipActive]}
                    >
                      <Text style={[styles.mealChipText, active && styles.mealChipTextActive]}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {portionPreview ? (
                <View style={styles.portionSummaryCard}>
                  <Text style={styles.portionSummaryTitle}>Portion summary</Text>

                  <View style={styles.portionTable}>
                    <View style={styles.portionRowTable}>
                      <Text style={styles.portionCellLeft}>Calories</Text>
                      <Text style={styles.portionCellRight}>{portionPreview.kcal} kcal</Text>
                    </View>

                    <View style={styles.portionRowTable}>
                      <Text style={styles.portionCellLeft}>Protein</Text>
                      <Text style={styles.portionCellRight}>{portionPreview.protein} g</Text>
                    </View>

                    <View style={styles.portionRowTable}>
                      <Text style={styles.portionCellLeft}>Carbs</Text>
                      <Text style={styles.portionCellRight}>{portionPreview.carbs} g</Text>
                    </View>

                    <View style={styles.portionRowTable}>
                      <Text style={styles.portionCellLeft}>Fat</Text>
                      <Text style={styles.portionCellRight}>{portionPreview.fat} g</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.portionHint}>Enter a valid amount to see portion summary.</Text>
              )}


              <Pressable
                style={[styles.addDiaryButton, (adding || !portionPreview) && styles.addDiaryButtonDisabled]}
                disabled={adding || !portionPreview}
                onPress={handleAddToDiary}
              >
                {adding ? (
                  <ActivityIndicator size="small" color={palette.onPrimary} />
                ) : (
                  <Text style={styles.addDiaryButtonText}>Add to diary</Text>
                )}
              </Pressable>
            </View>

            {/* Macros per 100 g */}
            {(product.fatPer100g != null ||
              product.carbsPer100g != null ||
              product.proteinsPer100g != null ||
              product.sugarsPer100g != null ||
              product.saltPer100g != null) && (
              <View style={styles.fullProductMacrosCard}>
                <Text style={styles.nutritionTitle}>Nutrition facts</Text>
                <Text style={styles.nutritionSubtitle}>per 100 g</Text>

                <View style={styles.nutritionTable}>
                  <View style={styles.nutritionHeaderRow}>
                    <Text style={[styles.nutritionHeaderCell, styles.nutritionCellLeft]}>Nutrient</Text>
                    <Text style={[styles.nutritionHeaderCell, styles.nutritionCellRight]}>Value</Text>
                  </View>

                  {product.fatPer100g != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionCell, styles.nutritionCellLeft]}>Fat</Text>
                      <Text style={[styles.nutritionCell, styles.nutritionCellRight]}>{product.fatPer100g} g</Text>
                    </View>
                  )}

                  {product.saturatedFatPer100g != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionCell, styles.nutritionCellLeft]}>Saturated fat</Text>
                      <Text style={[styles.nutritionCell, styles.nutritionCellRight]}>{product.saturatedFatPer100g} g</Text>
                    </View>
                  )}

                  {product.carbsPer100g != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionCell, styles.nutritionCellLeft]}>Carbohydrates</Text>
                      <Text style={[styles.nutritionCell, styles.nutritionCellRight]}>{product.carbsPer100g} g</Text>
                    </View>
                  )}

                  {product.sugarsPer100g != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionCell, styles.nutritionCellLeft]}>Sugars</Text>
                      <Text style={[styles.nutritionCell, styles.nutritionCellRight]}>{product.sugarsPer100g} g</Text>
                    </View>
                  )}

                  {product.proteinsPer100g != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionCell, styles.nutritionCellLeft]}>Protein</Text>
                      <Text style={[styles.nutritionCell, styles.nutritionCellRight]}>{product.proteinsPer100g} g</Text>
                    </View>
                  )}

                  {product.saltPer100g != null && (
                    <View style={styles.nutritionRow}>
                      <Text style={[styles.nutritionCell, styles.nutritionCellLeft]}>Salt</Text>
                      <Text style={[styles.nutritionCell, styles.nutritionCellRight]}>{product.saltPer100g} g</Text>
                    </View>
                  )}
                </View>
              </View>

            )}

            {product.ingredients && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <MaterialIcons name="restaurant-menu" size={18} color={palette.subText} />
                  <Text style={styles.infoCardTitle}>Ingredients</Text>
                </View>

                <Text style={styles.infoCardBody}>{product.ingredients}</Text>
              </View>
            )}


            {product.allergens && (
              <View style={styles.fullProductSection}>
                <Text style={styles.fullProductSectionTitle}>Allergens</Text>
                <Text style={styles.fullProductSectionBody}>{product.allergens}</Text>
              </View>
            )}

            <Pressable style={styles.fullProductCloseButton} onPress={handleReset}>
              <Text style={styles.fullProductCloseButtonText}>Back to scanner</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={15}
          style={styles.overlayRoot}
        >
          <View style={styles.overlayWrapper}>
            <View style={styles.overlayCard}>
              <Text style={styles.codeInfoText}>
                {last ? `Code: ${last.data} (${last.type})` : "Point the camera at a barcode\nor\nsearch by product name."}
              </Text>

              <View style={styles.searchRow}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Type product name..."
                  placeholderTextColor={palette.subText}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={loadProductByName}
                />
                <Pressable style={styles.searchButton} onPress={loadProductByName}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </Pressable>
              </View>

              {loadingProduct && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.loadingText}>Looking up the product...</Text>
                </View>
              )}

              {productError && !loadingProduct && <Text style={styles.errorText}>{productError}</Text>}

              {product && !loadingProduct && (
                <View style={styles.productRow}>
                  {product.imageUrl && <Image source={{ uri: product.imageUrl }} style={styles.productImage} />}

                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {product.name}
                    </Text>
                    {product.brand && <Text style={styles.productMeta}>{product.brand}</Text>}
                    {product.caloriesPer100g != null && (
                      <Text style={styles.productMeta}>{product.caloriesPer100g} kcal / 100g</Text>
                    )}
                  </View>
                </View>
              )}

              <Pressable style={styles.rescanButton} onPress={handleReset}>
                <Text style={styles.rescanButtonText}>{last ? "Scan again" : "Reset"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
