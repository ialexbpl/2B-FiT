// src/screens/AI/AIStyles.ts
// Notes:
// - `gap` is supported in newer RN versions; if you target older RN/Android, consider replacing
//   with margins between children for broader compatibility.
// - messagesScroll/messagesContent: this variant has no “card” surface; only content scrolls.
// - If you reintroduce a card, split styles: {conversation, card, messagesScroll} like earlier.

import { StyleSheet } from 'react-native';
import { theme as tokens, type Palette } from '@styles/theme';

export const makeAIStyles = (palette: Palette, theme = tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },

    // Only messages area scrolls (no extra card)
    messagesScroll: {
      flex: 1,
    },
    messagesContent: {
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 12,
    },

    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 10,
    },
    left: { justifyContent: 'flex-start' },
    right: { justifyContent: 'flex-end', alignSelf: 'flex-end' },

    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },

    bubble: {
      maxWidth: '80%',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
    },
    // Subtle differentiation via border color; both still match the app surface
    bubbleAI: { backgroundColor: palette.card, borderColor: palette.border },
    bubbleUser: { backgroundColor: palette.card, borderColor: theme.colors.primary },

    messageText: { fontSize: 16, lineHeight: 22 },
    messageTextAI: { color: palette.text },
    messageTextUser: { color: palette.text },

    timeText: {
      marginTop: 6,
      fontSize: 12,
      color: palette.subText,
      textAlign: 'right',
    },

    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      gap: 8, // Replace with margins if supporting older RN
      borderTopWidth: 1,
      borderTopColor: palette.border,
      backgroundColor: palette.card,
    },
    textInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: palette.border,
      color: palette.text,
      backgroundColor: palette.background,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconSecondary: {
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    iconPrimary: { backgroundColor: tokens.colors.primary },
  });
