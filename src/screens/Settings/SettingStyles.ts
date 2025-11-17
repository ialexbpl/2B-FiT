import { StyleSheet } from 'react-native';
import { theme, type Palette } from '@styles/theme';

export const makeSettingStyles = (palette: Palette) =>
  StyleSheet.create({
  
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: palette.card,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      marginLeft: 12,
      fontSize: 18,
      fontWeight: '600',
      color: palette.text,
    },
    content: {
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    card: {
      borderRadius: theme.radius.md,
      padding: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '600',
    },
    cardSubtitle: {
      color: palette.subText,
      fontSize: 13,
      marginTop: 4,
    },
    actionButtons: {
      marginTop: 16,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      ...theme.shadow.sm,
      marginTop: 12,
    },
    actionButtonFirst: {
      marginTop: 0,
    },
    actionButtonPressed: {
      opacity: 0.85,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      backgroundColor: `${palette.primary}14`,
    },
    actionTextWrap: {
      flex: 1,
    },
    actionTitle: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '600',
    },
    actionSubtitle: {
      color: palette.subText,
      fontSize: 13,
      marginTop: 4,
    },
    cardDivider: {
      height: 1,
      backgroundColor: palette.border,
      marginTop: 20,
      marginBottom: 16,
    },
    sectionSpacer: {
      height: 12,
    },
    usernameModalOverlay: {
      flex: 1,
      backgroundColor: palette.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    usernameModalCard: {
      width: '100%',
      maxWidth: 360,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      padding: 20,
    },
    usernameModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
      marginBottom: 8,
    },
    usernameModalSubtitle: {
      fontSize: 14,
      color: palette.subText,
      marginBottom: 16,
    },
    usernameModalInput: {
      borderWidth: 1,
      borderRadius: theme.radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    usernameModalError: {
      color: theme.colors.danger,
      fontSize: 13,
      marginTop: 8,
    },
    usernameModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 20,
    },
    usernameModalButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      marginLeft: 12,
      minWidth: 96,
      alignItems: 'center',
    },
    usernameModalButtonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    usernameModalPrimaryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    usernameModalPrimaryText: {
      fontSize: 15,
      fontWeight: '600',
      color: palette.onPrimary,
    },
  });

export default makeSettingStyles;

