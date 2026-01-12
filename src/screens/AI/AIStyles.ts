// src/screens/AI/AIStyles.ts
// Enhanced AI chatbot styles with gradients, animations, and modern effects

import { StyleSheet } from 'react-native';
import { theme as tokens, type Palette } from '@styles/theme';

export const makeAIStyles = (palette: Palette, theme = tokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },

    // Messages area
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
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: palette.card,
      alignSelf: 'flex-end',
      marginBottom: 4,
      // Enhanced shadow for avatar
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },

    bubble: {
      maxWidth: '75%',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 22,
      // Enhanced shadow for depth
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },

    bubbleAI: {
      backgroundColor: palette.card,
      borderBottomLeftRadius: 6,
      // Subtle border for AI messages
      borderWidth: 1,
      borderColor: palette.border || 'rgba(0,0,0,0.05)',
    },
    bubbleUser: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 6,
      // Enhanced shadow with primary color for user messages
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },

    messageText: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: 0.2,
    },
    messageTextAI: {
      color: palette.text,
    },
    messageTextUser: {
      color: palette.onPrimary,
      fontWeight: '500',
    },

    timeText: {
      marginTop: 6,
      fontSize: 11,
      color: palette.subText,
      textAlign: 'right',
      opacity: 0.65,
      letterSpacing: 0.3,
    },

    // Enhanced input bar with floating effect
    inputBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: palette.background,
      borderTopWidth: 1,
      borderTopColor: palette.border || 'rgba(0,0,0,0.06)',
      // Subtle shadow to create floating effect
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 8,
    },
    textInput: {
      flex: 1,
      minHeight: 46,
      maxHeight: 100,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 26,
      backgroundColor: palette.card,
      color: palette.text,
      fontSize: 16,
      marginRight: 10,
      // Enhanced shadow for input field
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      // Subtle border
      borderWidth: 1,
      borderColor: palette.border || 'rgba(0,0,0,0.05)',
    },
    iconButton: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      // Smooth transitions
      transform: [{ scale: 1 }],
    },
    iconSecondary: {
      marginRight: 10,
      backgroundColor: palette.card,
      // Subtle shadow for camera button
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    iconPrimary: {
      backgroundColor: theme.colors.primary,
      // Enhanced glow effect for send button
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    iconPrimaryDisabled: {
      opacity: 0.5,
      shadowOpacity: 0.15,
    },

    // Typing indicator container
    typingContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
  });
