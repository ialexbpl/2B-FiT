// src/screens/AI/AIStyles.ts
// Notes:
// - `gap` is supported in newer RN versions; if you target older RN/Android, consider replacing
//   with margins between children for broader compatibility.
// - messagesScroll/messagesContent: this variant has no "card" surface; only content scrolls.
// - If you reintroduce a card, split styles: {conversation, card, messagesScroll} like earlier.

import { StyleSheet } from 'react-native';
import { theme as tokens, type Palette } from '@styles/theme';

export const makeAIStyles = (palette: Palette, theme = tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },

    // Only messages area scrolls
    messagesScroll: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 20,
    },

    messageRow: {
      flexDirection: 'row',
      marginBottom: 16,
      maxWidth: '100%',
    },
    left: { justifyContent: 'flex-start' },
    right: { justifyContent: 'flex-end' },

    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
      backgroundColor: palette.card, // Fallback if image fails
      alignSelf: 'flex-end', // Align avatar to bottom of message group
      marginBottom: 4,
    },

    bubble: {
      maxWidth: '75%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 20,
      // Shadow for depth
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },

    bubbleAI: {
      backgroundColor: palette.card,
      borderBottomLeftRadius: 4, // Chat bubble effect
    },
    bubbleUser: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4, // Chat bubble effect
    },

    messageText: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'Inter-Regular', // Assuming Inter is available, else falls back
    },
    messageTextAI: {
      color: palette.text,
    },
    messageTextUser: {
      color: palette.onPrimary, // White or contrasting text for primary color
    },

    timeText: {
      marginTop: 4,
      fontSize: 11,
      color: palette.subText,
      textAlign: 'right',
      opacity: 0.7,
    },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: palette.background, // Seamless with background
      // borderTopWidth: 1,
      // borderTopColor: palette.border,
    },
    textInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24, // Pill shape
      backgroundColor: palette.card,
      color: palette.text,
      fontSize: 16,
      marginRight: 10,
      // Shadow for input
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconSecondary: {
      marginRight: 10,
      backgroundColor: palette.card,
    },
    iconPrimary: {
      backgroundColor: theme.colors.primary,
      // Shadow for send button
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  });
