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
} from "react-native";
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
} from "../../api/OpenFoodFacts";
import { getScannerStyles } from "./ScannerStyles";
import { useTheme } from "../../context/ThemeContext";

export default function Scanner() {
  const { palette } = useTheme();
  const styles = getScannerStyles(palette);

  const [permission, requestPermission] = useCameraPermissions();
  const [enabled, setEnabled] = useState(true);
  const [last, setLast] = useState<BarcodeScanningResult | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showProductFull, setShowProductFull] = useState(false);

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


  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>
          I need camera access to scan barcodes.
        </Text>
        <Text style={styles.permissionText}>
          Camera data is never sent anywhere outside your app.
        </Text>

        <Text onPress={requestPermission} style={styles.permissionButtonText}>
          Grant permission
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={settings}
        onBarcodeScanned={handleScan}
      />

      {product && showProductFull ? (
        <View style={styles.fullProductWrapper}>
          <ScrollView
            contentContainerStyle={styles.fullProductContent}
            showsVerticalScrollIndicator={false}
          >
            {product.imageUrl && (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.fullProductImage}
              />
            )}

            <Text style={styles.fullProductTitle}>{product.name}</Text>

            {product.brand && (
              <Text style={styles.fullProductBrand}>{product.brand}</Text>
            )}

            {product.caloriesPer100g != null && (
              <Text style={styles.fullProductMeta}>
                {product.caloriesPer100g} kcal / 100g
              </Text>
            )}

            {/* Ilość / opakowanie */}
            {product.quantity && (
              <Text style={styles.fullProductMeta}>
                Quantity / package: {product.quantity}
              </Text>
            )}

            {/* Nutri-Score */}
            {product.nutrigrade && (
              <Text
                style={[
                  styles.fullProductNutri,
                  { color: getNutriScoreColor(product.nutrigrade) },
                ]}
              >
                Nutri-Score: {product.nutrigrade.toUpperCase()}
              </Text>
            )}


            {/* Makro na 100 g */}
            {(product.fatPer100g != null ||
              product.carbsPer100g != null ||
              product.proteinsPer100g != null ||
              product.sugarsPer100g != null ||
              product.saltPer100g != null) && (
              <View style={styles.fullProductMacrosCard}>
                <Text style={styles.fullProductSectionTitle}>
                  Nutrition facts / 100 g
                </Text>
                {product.fatPer100g != null && (
                  <Text style={styles.fullProductMacroRow}>
                    Fat: {product.fatPer100g} g
                  </Text>
                )}
                {product.saturatedFatPer100g != null && (
                  <Text style={styles.fullProductMacroRow}>
                    of which saturated: {product.saturatedFatPer100g} g
                  </Text>
                )}
                {product.carbsPer100g != null && (
                  <Text style={styles.fullProductMacroRow}>
                    Carbohydrates: {product.carbsPer100g} g
                  </Text>
                )}
                {product.sugarsPer100g != null && (
                  <Text style={styles.fullProductMacroRow}>
                    of which sugars: {product.sugarsPer100g} g
                  </Text>
                )}
                {product.proteinsPer100g != null && (
                  <Text style={styles.fullProductMacroRow}>
                    Protein: {product.proteinsPer100g} g
                  </Text>
                )}
                {product.saltPer100g != null && (
                  <Text style={styles.fullProductMacroRow}>
                    Salt: {product.saltPer100g} g
                  </Text>
                )}
              </View>
            )}

            {/* Skład */}
            {product.ingredients && (
              <View style={styles.fullProductSection}>
                <Text style={styles.fullProductSectionTitle}>Ingredients</Text>
                <Text style={styles.fullProductSectionBody}>
                  {product.ingredients}
                </Text>
              </View>
            )}

            {/* Alergeny */}
            {product.allergens && (
              <View style={styles.fullProductSection}>
                <Text style={styles.fullProductSectionTitle}>Allergens</Text>
                <Text style={styles.fullProductSectionBody}>
                  {product.allergens}
                </Text>
              </View>
            )}

            <Pressable
              style={styles.fullProductCloseButton}
              onPress={handleReset}
            >
              <Text style={styles.fullProductCloseButtonText}>
                Back to scanner
              </Text>
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
              {/* Info o zeskanowanym kodzie */}
              <Text style={styles.codeInfoText}>
                {last
                  ? `Code: ${last.data} (${last.type})`
                  : "Point the camera at a barcode\nor\nsearch by product name."}
              </Text>

              {/* Pasek wyszukiwania po nazwie */}
              <View style={styles.searchRow}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Type product name…"
                  placeholderTextColor={palette.subText}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={loadProductByName}
                />
                <Pressable
                  style={styles.searchButton}
                  onPress={loadProductByName}
                >
                  <Text style={styles.searchButtonText}>Search</Text>
                </Pressable>
              </View>

              {/* Status ładowania produktu */}
              {loadingProduct && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.loadingText}>
                    Looking up the product…
                  </Text>
                </View>
              )}

              {/* Błąd z API */}
              {productError && !loadingProduct && (
                <Text style={styles.errorText}>{productError}</Text>
              )}

              {product && !loadingProduct && (
                <View style={styles.productRow}>
                  {product.imageUrl && (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.productImage}
                    />
                  )}

                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {product.name}
                    </Text>
                    {product.brand && (
                      <Text style={styles.productMeta}>{product.brand}</Text>
                    )}
                    {product.caloriesPer100g != null && (
                      <Text style={styles.productMeta}>
                        {product.caloriesPer100g} kcal / 100g
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <Pressable style={styles.rescanButton} onPress={handleReset}>
                <Text style={styles.rescanButtonText}>
                  {last ? "Scan again" : "Reset"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
