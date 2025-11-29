import { StyleSheet } from "react-native";
import { theme, Palette } from "../../../styles/theme";

export const getScannerStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },

    camera: {
      flex: 1,
    },

    backButton: {
      position: "absolute",
      top: theme.spacing(4),
      left: theme.spacing(2),
      zIndex: 10,
      padding: theme.spacing(1),
      borderRadius: theme.radius.xl,
      backgroundColor: palette.overlay ?? "#00000080",
    },

    /* -------- PERMISSIONS SCREEN -------- */
    permissionContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing(3),
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(1.5),
      backgroundColor: palette.background,
    },
    permissionTitle: {
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
      color: palette.text,
    },
    permissionText: {
      fontSize: 14,
      color: palette.subText,
      textAlign: "center",
    },
    permissionButtonText: {
      marginTop: theme.spacing(2),
      paddingHorizontal: theme.spacing(3),
      paddingVertical: theme.spacing(1.5),
      borderRadius: theme.radius.xl,
      backgroundColor: palette.primary,
      color: palette.onPrimary,
      fontWeight: "600",
      overflow: "hidden",
    },

    /* -------- BOTTOM OVERLAY -------- */
    overlayRoot: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 15,
      justifyContent: "flex-end",
    },

    overlayWrapper: {
      padding: theme.spacing(2),
    },

    overlayCard: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing(2),
      backgroundColor: palette.overlay,
      ...theme.shadow.md,
      gap: theme.spacing(1.25),
    },

    codeInfoText: {
      color: "#fff",
      fontWeight: "600",
      marginBottom: 2,
      fontSize: 14,
      textAlign: "center",
    },

    /* -------- SEARCH BY NAME -------- */
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      marginTop: theme.spacing(0.5),
    },
    searchInput: {
      flex: 1,
      paddingHorizontal: theme.spacing(1.5),
      paddingVertical: theme.spacing(1),
      borderRadius: theme.radius.md,
      backgroundColor: palette.card100,
      color: palette.text,
      borderWidth: 1,
      borderColor: palette.border,
      fontSize: 14,
    },
    searchButton: {
      paddingHorizontal: theme.spacing(2),
      paddingVertical: theme.spacing(1),
      borderRadius: theme.radius.md,
      backgroundColor: palette.primary,
      justifyContent: "center",
      alignItems: "center",
      ...theme.shadow.sm,
    },
    searchButtonText: {
      color: palette.onPrimary,
      fontWeight: "600",
      fontSize: 14,
    },

    /* -------- LOADING ROW -------- */
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing(1),
      marginTop: theme.spacing(0.5),
    },
    loadingText: {
      color: palette.text,
      opacity: 0.9,
      fontSize: 14,
    },

    /* -------- ERROR -------- */
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      fontWeight: "500",
      marginTop: theme.spacing(0.5),
      textAlign: "center",
    },

    /* -------- PRODUCT CARD (MINI PREVIEW) -------- */
    productRow: {
      flexDirection: "row",
      gap: theme.spacing(1.5),
      alignItems: "center",
      marginTop: theme.spacing(0.75),
    },

    productImage: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.md,
      backgroundColor: palette.card,
    },

    productInfo: {
      flex: 1,
    },
    productTitle: {
      color: palette.text,
      fontWeight: "700",
      marginBottom: 2,
      fontSize: 15,
    },
    productMeta: {
      color: palette.subText,
      fontSize: 13,
    },

    /* -------- RESCAN BUTTON (GREEN) -------- */
    rescanButton: {
      marginTop: theme.spacing(1.25),
      borderRadius: theme.radius.lg,
      backgroundColor: palette.primary,
      paddingVertical: theme.spacing(1.25),
      justifyContent: "center",
      alignItems: "center",
      ...theme.shadow.sm,
    },
    rescanButtonText: {
      color: palette.onPrimary,
      fontWeight: "700",
      fontSize: 14,
    },

    /* -------- FULLSCREEN PRODUCT VIEW -------- */
    fullProductWrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: palette.background,
      paddingTop: theme.spacing(4),
      paddingHorizontal: theme.spacing(2),
    },
    fullProductContent: {
      paddingBottom: theme.spacing(4),
      alignItems: "center",
      gap: theme.spacing(2),
    },
    fullProductImage: {
      width: 180,
      height: 180,
      borderRadius: theme.radius.xl,
      backgroundColor: palette.card,
      ...theme.shadow.md,
    },
    fullProductTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: palette.text,
      textAlign: "center",
    },
    fullProductBrand: {
      fontSize: 16,
      color: palette.subText,
      textAlign: "center",
    },
    fullProductMeta: {
      fontSize: 14,
      color: palette.subText,
      textAlign: "center",
    },
    fullProductCloseButton: {
      marginTop: theme.spacing(2),
      paddingVertical: theme.spacing(1.5),
      paddingHorizontal: theme.spacing(3),
      borderRadius: theme.radius.lg,
      backgroundColor: palette.primary,
      ...theme.shadow.md,
    },
    fullProductCloseButtonText: {
      color: palette.onPrimary,
      fontWeight: "600",
      fontSize: 14,
      textAlign: "center",
    },
    fullProductNutri: {
  marginTop: theme.spacing(0.5),
  fontSize: 16,
  fontWeight: "700",
  color: palette.primary,
  textAlign: "center",
},

fullProductMacrosCard: {
  marginTop: theme.spacing(2),
  width: "100%",
  borderRadius: theme.radius.lg,
  backgroundColor: palette.card100,
  padding: theme.spacing(2),
  ...theme.shadow.sm,
},

fullProductSection: {
  marginTop: theme.spacing(2),
  width: "100%",
},

fullProductSectionTitle: {
  fontSize: 14,
  fontWeight: "600",
  color: palette.text,
  marginBottom: theme.spacing(0.5),
},

fullProductSectionBody: {
  fontSize: 13,
  color: palette.subText,
},

fullProductMacroRow: {
  fontSize: 13,
  color: palette.text,
  marginTop: 2,
},
});
