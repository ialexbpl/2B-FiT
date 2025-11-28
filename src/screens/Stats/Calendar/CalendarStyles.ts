import { StyleSheet } from 'react-native';
import { theme, type Palette } from '@styles/theme';

export const makeCalendarStyles = (palette: Palette, tokens = theme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },

    card: {
      backgroundColor: palette.card,
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      marginHorizontal: 8,
      paddingVertical: 12,
      marginTop: 8,
      paddingBottom: 20,
    },

    headerRow: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.subText,
      textTransform: 'capitalize',
    },

    picker: {
      height: 74,
      paddingVertical: 8,
      alignItems: 'center',
    },

    itemRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },

    item: {
      width: 40,
      height: 50,
      paddingVertical: 6,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: palette.border,
      backgroundColor: palette.card,
      alignItems: 'center',
      justifyContent: 'center',
    },

    itemWeekday: {
      fontSize: 13,
      fontWeight: '500',
      color: palette.subText,
      marginBottom: 4,
      textTransform: 'capitalize',
    },
    itemDate: {
      fontSize: 15,
      fontWeight: '600',
      color: palette.text,
    },

    // === Events ===
    eventsHeaderRow: {
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
    },
    eventsHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.text,
    },
    eventsList: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 8,
    },
    eventItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      gap: 10,
      marginHorizontal: 4,
      marginVertical: 4,
    },
    eventDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 6,
    },
    eventTime: {
      fontSize: 13,
      color: palette.subText,
      marginBottom: 2,
    },
    eventTitle: {
      fontSize: 15,
      color: palette.text,
      fontWeight: '700',
    },
    eventDesc: {
      fontSize: 14,
      color: palette.text,
      marginTop: 2,
    },
    emptyText: {
      paddingHorizontal: 16,
      color: palette.subText,
      fontSize: 14,
      marginTop: 4,
    },

    // === FAB ===
    fab: {
      position: 'absolute',
      right: 18,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: palette.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    fabPlus: {
      fontSize: 30,
      color: palette.onPrimary,
      lineHeight: 30,
      marginTop: -2,
    },

    // === Modal ===
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: palette.card100 ?? palette.card,
      padding: 16,
      paddingBottom: 16 + 8,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: 1,
      borderColor: palette.border,
      gap: 12,
      ...theme.shadow.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.border,
      marginBottom: 4,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    dateCol: {
      flex: 1,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.text,
    },
    modalSubtitle: {
      fontSize: 13,
      color: palette.subText,
      textTransform: 'capitalize',
      marginTop: 2,
    },

    typePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 999,
      gap: 6,
    },
    typeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    typePillText: {
      color: palette.text,
      fontWeight: '700',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      borderWidth: 1,
      borderRadius: 10,
      borderColor: palette.border,
      backgroundColor: palette.background,
      alignItems: 'center',
    },
    segmentInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    segmentDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '700',
      color: palette.text,
    },

    row: {
      flexDirection: 'row',
      marginTop: 4,
    },
    field: {
      flex: 1,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    label: {
      fontSize: 12,
      color: palette.subText,
    },
    charCounter: {
      fontSize: 12,
      color: palette.subText,
    },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: palette.text,
      backgroundColor: palette.background,
      fontSize: 14,
    },

    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    presetChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
    },
    presetChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: palette.text,
    },
    durationPill: {
      marginLeft: 'auto',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    durationText: {
      fontSize: 12,
      color: palette.subText,
      fontWeight: '600',
    },

    errorText: {
      color: theme.colors.danger,
      fontSize: 13,
      marginTop: 2,
    },

    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 100,
      marginBottom: -15,
    },
    btn: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
    },
    btnGhost: {
      backgroundColor: 'transparent',
      borderColor: palette.border,
    },
    btnGhostText: {
      color: palette.text,
      fontWeight: '700',
    },
    btnPrimary: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    btnPrimaryText: {
      color: palette.onPrimary,
      fontWeight: '800',
    },
    btnDisabled: {
      opacity: 0.6,
    },
  });
