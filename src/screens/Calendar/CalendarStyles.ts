import { StyleSheet, Dimensions } from 'react-native';
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
    },

    headerRow: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.subText,
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
      paddingHorizontal: tokens.spacing(1),
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
  });
